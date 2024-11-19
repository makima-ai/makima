import { drizzle } from "drizzle-orm/node-postgres";
import { pgTable, text, timestamp, uuid, jsonb } from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { sql, cosineDistance, desc, gt, and } from "drizzle-orm";
import { vector } from "drizzle-orm/pg-core";
import type {
  KnowledgeBase,
  KnowledgeProviderAdapter,
  Document,
  SearchResult,
} from "../types";
import { universalEmbed } from "../../inference";

export class PGVectorAdapter implements KnowledgeProviderAdapter {
  private db: ReturnType<typeof drizzle>;
  model: string;
  private tableName: string;
  private embeddingSize: number | null = null;

  constructor(kb: KnowledgeBase & { connectionURI: string }) {
    this.model = kb.embedding_model;
    const pool = new Pool({
      connectionString: kb.connectionURI,
    });
    this.db = drizzle(pool);
    this.tableName = `kb_${kb.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  }

  async initialize(): Promise<void> {
    await this.db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
    const embeddingSize = await this.getEmbeddingSize();
    await this.db.execute(sql`
      CREATE TABLE IF NOT EXISTS ${sql.raw(this.tableName)} (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        content TEXT NOT NULL,
        embedding vector(${sql.raw(embeddingSize.toString())}),
        metadata JSONB,
        model TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  private async getEmbeddingSize(): Promise<number> {
    if (this.embeddingSize === null) {
      const testDocument = {
        content: "Test content",
        id: "test",
        model: this.model,
      };
      const [embedding] = await universalEmbed({
        model: this.model,
        documents: [testDocument],
      });
      this.embeddingSize = embedding.embeddings[0].length;
    }
    return this.embeddingSize;
  }

  private getDocumentsTable() {
    return pgTable(this.tableName, {
      id: uuid("id").defaultRandom().primaryKey(),
      content: text("content").notNull(),
      embedding: vector("embedding", { dimensions: this.embeddingSize! }),
      metadata: jsonb("metadata"),
      model: text("model").notNull(),
      createdAt: timestamp("created_at").defaultNow(),
    });
  }

  async search(
    query: string,
    k: number,
    modelFilter?: string,
  ): Promise<SearchResult[]> {
    const [queryEmbedding] = await universalEmbed({
      model: this.model,
      documents: [{ content: query, id: "query", model: this.model }],
    });

    const documentsTable = this.getDocumentsTable();
    const similarity = sql<number>`1 - (${cosineDistance(documentsTable.embedding, queryEmbedding.embeddings[0])})`;

    let baseQuery = this.db
      .select({
        id: documentsTable.id,
        content: documentsTable.content,
        model: documentsTable.model,
        metadata: documentsTable.metadata,
        similarity: similarity,
      })
      .from(documentsTable)
      .where(
        and(
          sql`${documentsTable.model} = ${modelFilter || this.model}`,
          gt(similarity, 0.1),
        ),
      )
      .orderBy(desc(similarity))
      .limit(k);

    const results = await baseQuery;

    return results.map((row) => ({
      id: row.id,
      content: row.content,
      model: row.model,
      metadata: row.metadata as Record<string, unknown> | undefined,
      similarity: row.similarity,
    }));
  }

  async addDocument(document: Document): Promise<{ id: string }> {
    const [embedding] = await universalEmbed({
      model: this.model,
      documents: [document],
    });

    const documentsTable = this.getDocumentsTable();

    const [result] = await this.db
      .insert(documentsTable)
      .values({
        content: document.content,
        embedding: embedding.embeddings[0],
        metadata: document.metadata,
        model: this.model,
      })
      .returning({ id: documentsTable.id });

    return { id: result.id };
  }

  async updateDocument(document: Document): Promise<{ id: string }> {
    const [embedding] = await universalEmbed({
      model: this.model,
      documents: [document],
    });

    const documentsTable = this.getDocumentsTable();

    const [result] = await this.db
      .update(documentsTable)
      .set({
        content: document.content,
        embedding: embedding.embeddings[0],
        metadata: document.metadata,
        model: this.model,
      })
      .where(sql`${documentsTable.id} = ${document.id}`)
      .returning({ id: documentsTable.id });

    return { id: result.id };
  }

  async removeDocument(documentId: string): Promise<void> {
    const documentsTable = this.getDocumentsTable();
    await this.db
      .delete(documentsTable)
      .where(sql`${documentsTable.id} = ${documentId}`);
  }

  async getDocuments(filter: Record<string, string>): Promise<Document[]> {
    const documentsTable = this.getDocumentsTable();

    const whereClause = Object.entries(filter).reduce(
      (acc, [key, value]) => {
        return sql`${acc} AND ${documentsTable.metadata}->>${key} = ${value}`;
      },
      sql`TRUE`,
    );

    const results = await this.db
      .select()
      .from(documentsTable)
      .where(whereClause);

    return results.map((row) => ({
      id: row.id,
      content: row.content,
      model: row.model,
      metadata: row.metadata as Record<string, unknown> | undefined,
    }));
  }

  async delete(): Promise<void> {
    await this.db.execute(sql`DROP TABLE IF EXISTS ${sql.raw(this.tableName)}`);
  }
}
