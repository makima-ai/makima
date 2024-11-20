import { drizzle } from "drizzle-orm/node-postgres";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  jsonb,
  varchar,
} from "drizzle-orm/pg-core";
import { Pool } from "pg";
import { sql, cosineDistance, desc, gt, and, eq } from "drizzle-orm";
import { vector } from "drizzle-orm/pg-core";
import type {
  KnowledgeBase,
  KnowledgeProviderAdapter,
  Document,
  SearchResult,
} from "../types";
import { universalEmbed } from "../../inference";
import { getKnowledgeBaseModels } from "..";

export class PGVectorAdapter implements KnowledgeProviderAdapter {
  private db: ReturnType<typeof drizzle>;
  model: string;
  private tableName: string;
  private embeddingSizes: Record<string, number> = {};
  private kb: KnowledgeBase;

  constructor(kb: KnowledgeBase & { connectionURI: string }) {
    this.kb = kb;
    this.model = kb.embedding_model;
    const pool = new Pool({
      connectionString: kb.connectionURI,
    });
    this.db = drizzle(pool);
    this.tableName = `kb_${kb.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;
  }

  private normalizeModelName(model: string): string {
    return model.toLowerCase().replace(/[^a-z0-9]/g, "_");
  }

  async initialize(): Promise<void> {
    console.log("Initializing PGVectorAdapter...");
    await this.db.execute(sql`CREATE EXTENSION IF NOT EXISTS vector`);
    console.log("Vector extension ensured.");
    await this.createOrUpdateTable();
    console.log("Table creation or update completed.");
  }

  private async createOrUpdateTable(): Promise<void> {
    const tableExists = await this.checkIfTableExists();
    const models =
      this.kb.models || [this.kb.embedding_model] ||
      (await getKnowledgeBaseModels(this.kb.name));

    if (!tableExists) {
      await this.createTable(models);
    } else {
      await this.updateTable(models);
    }
  }

  private async checkIfTableExists(): Promise<boolean> {
    console.log("checking", this.tableName);
    const result = await this.db.execute(sql`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = ${this.tableName}
      );
    `);
    return !!result.rows[0].exists;
  }

  private async createTable(models: string[]): Promise<void> {
    const baseColumns = `
      id UUID PRIMARY KEY,
      content TEXT NOT NULL,
      metadata JSONB,
      model TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    `;

    const embeddingColumns = await Promise.all(
      models.map(async (model) => {
        const normalizedModel = this.normalizeModelName(model);
        const embeddingSize = await this.getEmbeddingSize(model);
        return `embedding_${normalizedModel} vector(${embeddingSize})`;
      }),
    );

    const allColumns = [baseColumns, ...embeddingColumns].join(", ");

    await this.db.execute(sql`
      CREATE TABLE ${sql.raw(this.tableName)} (
        ${sql.raw(allColumns)}
      )
    `);
  }

  private async updateTable(models: string[]): Promise<void> {
    const existingColumns = await this.getExistingColumns();

    for (const model of models) {
      const normalizedModel = this.normalizeModelName(model);
      if (!existingColumns.includes(`embedding_${normalizedModel}`)) {
        const embeddingSize = await this.getEmbeddingSize(model);
        await this.db.execute(sql`
          ALTER TABLE ${sql.raw(this.tableName)}
          ADD COLUMN ${sql.raw(`embedding_${normalizedModel}`)} vector(${sql.raw(embeddingSize.toString())})
        `);
      }
    }
  }

  private async getExistingColumns(): Promise<string[]> {
    const result = await this.db.execute(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = ${this.tableName}
    `);
    return result.rows.map((row: any) => row.column_name);
  }

  private async getEmbeddingSize(model: string): Promise<number> {
    if (!this.embeddingSizes[model]) {
      const testDocument = {
        content: "Test content",
        id: "test",
        model: model,
      };
      const [embedding] = await universalEmbed({
        model: model,
        documents: [testDocument],
      });
      this.embeddingSizes[model] = embedding.embeddings[0].length;
    }
    return this.embeddingSizes[model];
  }

  private getDocumentsTable() {
    const columns: Record<string, any> = {
      id: uuid("id").primaryKey(),
      content: text("content").notNull(),
      metadata: jsonb("metadata"),
      model: varchar("model", { length: 255 }).notNull(),
      createdAt: timestamp("created_at").defaultNow(),
    };

    for (const model of Object.keys(this.embeddingSizes)) {
      columns[`embedding_${model}`] = vector(`embedding_${model}`, {
        dimensions: this.embeddingSizes[model],
      });
    }

    return pgTable(this.tableName, columns);
  }

  async search(
    query: string,
    k: number,
    modelFilter?: string,
  ): Promise<SearchResult[]> {
    const documentsTable = this.getDocumentsTable();
    const searchModel = modelFilter || this.model;
    const [queryEmbedding] = await universalEmbed({
      model: searchModel,
      documents: [{ content: query, id: "query", model: searchModel }],
    });

    const embeddingColumn = sql.raw(`embedding_${searchModel}`);
    const similarity = sql<number>`1 - (${cosineDistance(embeddingColumn, queryEmbedding.embeddings[0])})`;

    let baseQuery = this.db
      .select({
        id: documentsTable.id,
        content: documentsTable.content,
        model: documentsTable.model,
        metadata: documentsTable.metadata,
        similarity: similarity,
      })
      .from(documentsTable)
      .where(and(eq(documentsTable.model, searchModel), gt(similarity, 0.1)))
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
    const model = document.model;
    const [embedding] = await universalEmbed({
      model: model,
      documents: [document],
    });

    const documentsTable = this.getDocumentsTable();

    const [result] = await this.db
      .insert(documentsTable)
      .values({
        id: document.id,
        content: document.content,
        [`embedding_${model}`]: embedding.embeddings[0],
        metadata: document.metadata,
        model: model,
      })
      .returning({ id: documentsTable.id });

    return { id: result.id };
  }

  async updateDocument(document: Document): Promise<{ id: string }> {
    const model = document.model;
    const [embedding] = await universalEmbed({
      model: model,
      documents: [document],
    });

    const documentsTable = this.getDocumentsTable();

    const [result] = await this.db
      .update(documentsTable)
      .set({
        content: document.content,
        [`embedding_${model}`]: embedding.embeddings[0],
        metadata: document.metadata,
        model: model,
      })
      .where(eq(documentsTable.id, document.id))
      .returning({ id: documentsTable.id });

    return { id: result.id };
  }

  async removeDocument(documentId: string): Promise<void> {
    const documentsTable = this.getDocumentsTable();
    await this.db
      .delete(documentsTable)
      .where(eq(documentsTable.id, documentId));
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
