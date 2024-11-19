import {
  addKnowledgeBasetoDB,
  getKnowledgeBaseByName,
  deleteKnowledgeBaseOnDB,
  updateKnowledgeBaseOnDB,
  updateEmbeddingModel,
} from "../../db/knowledge";
import { env } from "../../env";
import { PGVectorAdapter } from "./adapter/pgvector";
import type {
  KnowledgeBase,
  KnowledgeProviderAdapter,
  Document,
  SearchResult,
} from "./types";

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

export async function createKnowledgeBase(kb: KnowledgeBase) {
  const adapter = createKnowledgeBaseProviderAdapter(kb);
  await adapter.initialize();
  const data = await addKnowledgeBasetoDB(kb);
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

export async function updateKnowledgeBase(
  knowledgeBaseName: string,
  updates: { embedding_model?: string; description?: string },
) {
  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }

  if (updates.embedding_model) {
    await updateEmbeddingModel(knowledgeBaseName, updates.embedding_model);
  }

  if (updates.description) {
    await updateKnowledgeBaseOnDB(knowledgeBaseName, {
      description: updates.description,
    });
  }

  const updatedKb = await getKnowledgeBaseByName(knowledgeBaseName);
  return updatedKb;
}

export async function addDocumentToKnowledgeBase(
  document: Omit<Document, "model">,
  knowledgeBaseName: string,
) {
  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }
  const adapter = createKnowledgeBaseProviderAdapter(kb);
  return adapter.addDocument({
    ...document,
    model: kb.embedding_model,
  });
}

export async function updateDocumentInKnowledgeBase(
  document: Omit<Document, "model">,
  knowledgeBaseName: string,
) {
  const kb = await getKnowledgeBaseByName(knowledgeBaseName);
  if (!kb) {
    throw new Error(`Knowledge base ${knowledgeBaseName} not found`);
  }
  const adapter = createKnowledgeBaseProviderAdapter(kb);
  return adapter.updateDocument({
    ...document,
    model: kb.embedding_model,
  });
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
) {
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
