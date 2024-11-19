import { db } from "../db";
import { eq } from "drizzle-orm";
import { knowledgeBaseTable } from "./schema";

// KnowledgeBase CRUD operations (This is only for database actions not to actually remove/add the vector stores on the provider side)

export const addKnowledgeBasetoDB = async (knowledgeStore: {
  name: string;
  embedding_model: string;
  database_provider: string;
  description?: string | null;
}) => {
  try {
    const [newKnowledgeStore] = await db
      .insert(knowledgeBaseTable)
      .values(knowledgeStore)
      .returning();
    return newKnowledgeStore;
  } catch (error) {
    console.error("Error creating knowledge store:", error);
    throw error;
  }
};

export const getKnowledgeBaseById = async (id: string) => {
  try {
    const [knowledgeStore] = await db
      .select()
      .from(knowledgeBaseTable)
      .where(eq(knowledgeBaseTable.id, id));
    return knowledgeStore || null;
  } catch (error) {
    console.error("Error getting knowledge store:", error);
    throw error;
  }
};

export const getKnowledgeBaseByName = async (name: string) => {
  try {
    const [knowledgeStore] = await db
      .select()
      .from(knowledgeBaseTable)
      .where(eq(knowledgeBaseTable.name, name));
    return knowledgeStore || null;
  } catch (error) {
    console.error("Error getting knowledge store:", error);
    throw error;
  }
};

export const updateKnowledgeBaseOnDB = async (
  name: string,
  updates: Partial<typeof knowledgeBaseTable.$inferInsert>,
) => {
  try {
    const [updatedKnowledgeStore] = await db
      .update(knowledgeBaseTable)
      .set(updates)
      .where(eq(knowledgeBaseTable.name, name))
      .returning();
    return updatedKnowledgeStore;
  } catch (error) {
    console.error("Error updating knowledge store:", error);
    throw error;
  }
};

export const deleteKnowledgeBaseOnDB = async (name: string) => {
  try {
    const [deletedKnowledgeStore] = await db
      .delete(knowledgeBaseTable)
      .where(eq(knowledgeBaseTable.name, name))
      .returning();
    return deletedKnowledgeStore;
  } catch (error) {
    console.error("Error deleting knowledge store:", error);
    throw error;
  }
};

export const listAllKnowledgeBases = async () => {
  try {
    const knowledgeStores = await db
      .select()
      .from(knowledgeBaseTable)
      .execute();
    return knowledgeStores;
  } catch (error) {
    console.error("Error listing knowledge stores:", error);
    throw error;
  }
};

export const updateEmbeddingModel = async (name: string, newModel: string) => {
  try {
    const [updatedKnowledgeStore] = await db
      .update(knowledgeBaseTable)
      .set({ embedding_model: newModel })
      .where(eq(knowledgeBaseTable.name, name))
      .returning();
    return updatedKnowledgeStore;
  } catch (error) {
    console.error("Error updating embedding model:", error);
    throw error;
  }
};
