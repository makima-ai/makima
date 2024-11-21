import { t, type Static } from "elysia";
import { Nullable } from "../../util-types";

export type Document = {
  content: string;
  model?: string;
  metadata?: Record<string, unknown>;
};

export const DatabaseDocument = t.Object({
  id: t.String(),
  content: t.String(),
  model: t.String(),
  metadata: t.Record(t.String(), t.Any()),
  createdAt: t.Optional(t.Date()),
});

export type KnowledgeBase = {
  name: string;
  description?: string | null;
  embedding_model: string;
  database_provider: string;
  models?: string[] | null;
};

export const KnowledgeBaseSchema = t.Object({
  id: t.String(),
  name: t.String(),
  description: t.Optional(Nullable(t.String())),
  embedding_model: t.String(),
  database_provider: t.String(),
  models: Nullable(t.Optional(t.Array(t.String()))),
  createdAt: t.Optional(t.Date()),
});

export type Embedding = {
  model: string;
  embeddings: number[][];
};

export const SearchResultSchema = t.Object({
  id: t.String(),
  content: t.String(),
  model: t.String(),
  metadata: t.Optional(t.Record(t.String(), t.Any())),
  similarity: t.Number(),
});

export type SearchResult = Static<typeof SearchResultSchema>;

export interface KnowledgeProviderAdapter {
  model: string;
  initialize(): Promise<void>;
  addDocument(document: Document): Promise<{ id: string }>;
  updateDocument(
    document: Partial<Document> & { id: string },
  ): Promise<{ id: string }>;
  removeDocument(documentId: string): Promise<void>;
  getDocuments(
    filter: Record<string, string>,
  ): Promise<Static<typeof DatabaseDocument>[]>;
  delete(): Promise<void>;
  search(
    query: string,
    k: number,
    modelFilter?: string,
  ): Promise<SearchResult[]>;
}
