import { Pool, type QueryResult } from "pg";
import pgvector from "pgvector/pg";
import type {
  KnowledgeBase,
  KnowledgeProviderAdapter,
  Document,
  SearchResult,
  DatabaseDocument,
} from "../types";
import { universalEmbed } from "../../inference";
import { getKnowledgeBaseModels } from "..";
import type { Static } from "elysia";

interface QueryResultRow {
  [key: string]: unknown;
}

interface DocumentRow extends QueryResultRow {
  id: string;
  content: string;
  model: string;
  metadata: Record<string, unknown>;
}

interface SearchResultRow extends DocumentRow {
  similarity: number;
}

export class PGVectorAdapter implements KnowledgeProviderAdapter {
  private pool: Pool;
  model: string;
  private tableName: string;
  private embeddingSizes: Record<string, number> = {};
  private kb: KnowledgeBase;

  constructor(kb: KnowledgeBase & { connectionURI: string }) {
    this.kb = kb;
    this.model = kb.embedding_model;
    this.pool = new Pool({
      connectionString: kb.connectionURI,
    });
    this.tableName = `kb_${kb.name.toLowerCase().replace(/[^a-z0-9]/g, "_")}`;

    // Register pgvector types for each connection
    this.pool.on("connect", async (client) => {
      await pgvector.registerTypes(client);
    });
  }

  private normalizeModelName(model: string): string {
    return model.toLowerCase().replace(/[^a-z0-9]/g, "_");
  }

  async initialize(): Promise<void> {
    console.log("Initializing PGVectorAdapter...");
    await this.executeQuery("CREATE EXTENSION IF NOT EXISTS vector");
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
    const result = await this.executeQuery<{ exists: boolean }>(
      `
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = $1
      );
    `,
      [this.tableName],
    );
    return result.rows[0].exists;
  }

  private async createTable(models: string[]): Promise<void> {
    const baseColumns = `
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

    await this.executeQuery(`
      CREATE TABLE ${this.tableName} (
        ${allColumns}
      )
    `);
  }

  private async updateTable(models: string[]): Promise<void> {
    const existingColumns = await this.getExistingColumns();

    for (const model of models) {
      const normalizedModel = this.normalizeModelName(model);
      if (!existingColumns.includes(`embedding_${normalizedModel}`)) {
        const embeddingSize = await this.getEmbeddingSize(model);
        await this.executeQuery(`
          ALTER TABLE ${this.tableName}
          ADD COLUMN embedding_${normalizedModel} vector(${embeddingSize})
        `);
      }
    }
  }

  private async getExistingColumns(): Promise<string[]> {
    const result = await this.executeQuery<{ column_name: string }>(
      `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
    `,
      [this.tableName],
    );
    return result.rows.map((row) => row.column_name);
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

  async addDocument(document: Document): Promise<{ id: string }> {
    const model = document.model || this.model;
    console.debug("Adding document with model:", model);
    const [embedding] = await universalEmbed({
      model: model,
      documents: [{ content: document.content, model: model }],
    });
    console.debug("Generated embedding:", embedding.embeddings[0].slice(0, 5));

    const column_name = `embedding_${this.normalizeModelName(model)}`;
    console.log("Column name:", column_name);

    const result = await this.executeQuery<{ id: string }>(
      `
      INSERT INTO ${this.tableName} (content, ${column_name}, metadata, model)
      VALUES ($1, $2, $3, $4)
      RETURNING id
    `,
      [
        document.content,
        pgvector.toSql(embedding.embeddings[0]),
        document.metadata,
        model,
      ],
    );

    console.debug("Document added with ID:", result.rows[0].id);
    return { id: result.rows[0].id };
  }

  async updateDocument(
    document: Partial<Document> & { id: string },
  ): Promise<{ id: string }> {
    const model = document.model || this.model;
    const [embedding] = await universalEmbed({
      model: model,
      documents: [{ content: document.content!, model: model }],
    });

    const column_name = `embedding_${this.normalizeModelName(model)}`;

    const result = await this.executeQuery<{ id: string }>(
      `
      UPDATE ${this.tableName}
      SET content = $1, ${column_name} = $2, metadata = $3, model = $4
      WHERE id = $5
      RETURNING id
    `,
      [
        document.content,
        pgvector.toSql(embedding.embeddings[0]),
        document.metadata,
        model,
        document.id,
      ],
    );

    return { id: result.rows[0].id };
  }

  async search(
    query: string,
    k: number,
    modelFilter?: string,
  ): Promise<SearchResult[]> {
    const searchModel = modelFilter || this.model;
    console.debug("Search model:", searchModel);
    const [queryEmbedding] = await universalEmbed({
      model: searchModel,
      documents: [{ content: query, model: searchModel }],
    });
    console.debug("Query embedding:", queryEmbedding.embeddings[0].slice(0, 5));

    const embeddingColumn = `embedding_${this.normalizeModelName(searchModel)}`;
    const result = await this.executeQuery<SearchResultRow>(
      `
      SELECT id, content, model, metadata, 
        1 - (${embeddingColumn} <=> $1) as similarity
      FROM ${this.tableName}
      WHERE model = $2 AND 1 - (${embeddingColumn} <=> $1) > 0.1
      ORDER BY ${embeddingColumn} <-> $1
      LIMIT $3
    `,
      [pgvector.toSql(queryEmbedding.embeddings[0]), searchModel, k],
    );

    console.debug("Search results:", result.rows);

    return result.rows.map((row) => ({
      id: row.id,
      content: row.content,
      model: row.model,
      metadata: row.metadata,
      similarity: row.similarity,
    }));
  }

  async removeDocument(documentId: string): Promise<void> {
    await this.executeQuery(
      `
      DELETE FROM ${this.tableName}
      WHERE id = $1
    `,
      [documentId],
    );
  }

  async getDocuments(
    filter: Record<string, string>,
  ): Promise<Static<typeof DatabaseDocument>[]> {
    const conditions = Object.entries(filter)
      .map(([key], index) => `metadata->>'${key}' = $${index + 1}`)
      .join(" AND ");

    const query = `
      SELECT id, content, model, metadata
      FROM ${this.tableName}
      ${conditions ? `WHERE ${conditions}` : ""}
    `;

    const result = await this.executeQuery<DocumentRow>(
      query,
      Object.values(filter),
    );

    return result.rows.map((row) => ({
      id: row.id as string,
      content: row.content as string,
      model: row.model as string,
      metadata: row.metadata as Record<string, unknown>,
      createdAt: row.created_at as Date,
    }));
  }

  async delete(): Promise<void> {
    await this.executeQuery(`DROP TABLE IF EXISTS ${this.tableName}`);
  }

  private async executeQuery<T extends QueryResultRow>(
    query: string,
    params: any[] = [],
  ): Promise<QueryResult<T>> {
    const client = await this.pool.connect();
    try {
      return await client.query<T>(query, params);
    } finally {
      client.release();
    }
  }
}
