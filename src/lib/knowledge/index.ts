import type { Static } from "elysia";
import {
  addKnowledgeBasetoDB,
  getKnowledgeBaseByName,
  deleteKnowledgeBaseOnDB,
  updateKnowledgeBaseOnDB,
} from "../../db/knowledge";
import { env } from "../../env";
import { PGVectorAdapter } from "./adapter/pgvector";
import type {
  KnowledgeBase,
  KnowledgeProviderAdapter,
  Document,
  SearchResult,
  DatabaseDocument,
} from "./types";

export const supported_database_providers = ["pgvector"] as const;

function createKnowledgeBaseProviderAdapter(
  kb: KnowledgeBase,
): KnowledgeProviderAdapter {
  switch (kb.database_provider) {
    case "pgvector":
      if (!env.PGVECTOR_URL) {
        throw new Error("PGVECTOR_URL is not set");
      }
      return new PGVectorAdapter({
        ...kb,
        connectionURI: env.PGVECTOR_URL,
      });

    default:
      throw new Error(`Unknown database provider: ${kb.database_provider}`);
  }
}

export async function getKnowledgeBaseModels(
  knowledgeBaseName: string,
): Promise<string[]> {
  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }
  return kb.models || [kb.embedding_model];
}

export async function createKnowledgeBase(kb: KnowledgeBase) {
  const adapter = createKnowledgeBaseProviderAdapter(kb);
  await adapter.initialize();
  const data = await addKnowledgeBasetoDB({
    ...kb,
    models: [kb.embedding_model],
  });
  return {
    id: data.id,
  };
}

export async function deleteKnowledgeBase(knowledgeBaseName: string) {
  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }
  const adapter = createKnowledgeBaseProviderAdapter(kb);
  await adapter.delete();
  await deleteKnowledgeBaseOnDB(knowledgeBaseName);
  return {
    message: `Knowledge base ${knowledgeBaseName} deleted successfully`,
  };
}

export async function resetKnowledgeBase(knowledgeBaseName: string) {
  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }
  const adapter = createKnowledgeBaseProviderAdapter(kb);
  await adapter.reset();
  return {
    message: `Knowledge base ${knowledgeBaseName} reset successfully`,
  };
}

export async function updateKnowledgeBase(
  knowledgeBaseName: string,
  updates: { embedding_model?: string; description?: string },
) {
  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }

  if (updates.embedding_model) {
    updates.embedding_model = updates.embedding_model;
  }

  const updatedKb = await updateKnowledgeBaseOnDB(knowledgeBaseName, updates);
  return updatedKb;
}

export async function addDocumentToKnowledgeBase(
  document: Document,
  knowledgeBaseName: string,
) {
  if (document.content.trim().length === 0) {
    throw new Error("Document content cannot be empty");
  }

  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }

  const adapter = createKnowledgeBaseProviderAdapter(kb);

  const result = await adapter.addDocument(document);

  const model = document.model || kb.embedding_model;

  const existingModels = await getKnowledgeBaseModels(knowledgeBaseName);

  if (!existingModels.includes(model)) {
    const updatedModels = [...existingModels, model];
    await updateKnowledgeBaseOnDB(knowledgeBaseName, { models: updatedModels });
  }

  return result;
}

export async function updateDocumentInKnowledgeBase(
  document: Partial<Document> & { id: string },
  knowledgeBaseName: string,
) {
  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }
  const adapter = createKnowledgeBaseProviderAdapter(kb);
  const result = await adapter.updateDocument(document);

  const normalizedModel = document.model || kb.embedding_model;
  const existingModels = await getKnowledgeBaseModels(knowledgeBaseName);

  if (!existingModels.includes(normalizedModel)) {
    const updatedModels = [...existingModels, normalizedModel];
    await updateKnowledgeBaseOnDB(knowledgeBaseName, { models: updatedModels });
  }

  return result;
}

export async function removeDocumentFromKnowledgeBase(
  documentId: string,
  knowledgeBaseName: string,
) {
  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }
  const adapter = createKnowledgeBaseProviderAdapter(kb);
  return adapter.removeDocument(documentId);
}

export async function getDocumentsFromKnowledgeBase(
  filter: Record<string, string>,
  knowledgeBaseName: string,
): Promise<Static<typeof DatabaseDocument>[]> {
  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }
  const adapter = createKnowledgeBaseProviderAdapter(kb);
  return adapter.getDocuments(filter);
}

export async function searchKnowledgeBase(
  knowledgeBaseName: string,
  query: string,
  k: number,
  modelFilter?: string,
): Promise<SearchResult[]> {
  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }
  const adapter = createKnowledgeBaseProviderAdapter(kb);
  return adapter.search(query, k, modelFilter);
}
