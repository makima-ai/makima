export type Document = {
  // id: string;
  content: string;
  model?: string;
  metadata?: Record<string, unknown>;
};

export type KnowledgeBase = {
  name: string;
  description?: string | null;
  embedding_model: string;
  database_provider: string;
  models?: string[] | null;
};

export type Embedding = {
  model: string;
  embeddings: number[][];
};

export type SearchResult = {
  id: string;
  content: string;
  model: string;
  metadata?: Record<string, unknown>;
  similarity: number;
};

export interface KnowledgeProviderAdapter {
  model: string;
  initialize(): Promise<void>;
  addDocument(
    document: Omit<Document, "id" | "model"> & { model?: string },
  ): Promise<{ id: string }>;
  updateDocument(
    document: Partial<Document> & { id: string },
  ): Promise<{ id: string }>;
  removeDocument(documentId: string): Promise<void>;
  getDocuments(filter: Record<string, string>): Promise<Document[]>;
  delete(): Promise<void>;
  search(
    query: string,
    k: number,
    modelFilter?: string,
  ): Promise<SearchResult[]>;
}
