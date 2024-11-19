import { db } from "../db";
import { eq } from "drizzle-orm";
import { knowledgeStoresTable } from "./schema";

// KnowledgeStore CRUD operations

export const createKnowledgeStore = async (knowledgeStore: {
  name: string;
  embedding_model: string;
  database_provider: string;
  description?: string;
}) => {
  try {
    const [newKnowledgeStore] = await db
      .insert(knowledgeStoresTable)
      .values(knowledgeStore)
      .returning();
    return newKnowledgeStore;
  } catch (error) {
    console.error("Error creating knowledge store:", error);
    throw error;
  }
};

export const getKnowledgeStoreById = async (id: string) => {
  try {
    const [knowledgeStore] = await db
      .select()
      .from(knowledgeStoresTable)
      .where(eq(knowledgeStoresTable.id, id));
    return knowledgeStore || null;
  } catch (error) {
    console.error("Error getting knowledge store:", error);
    throw error;
  }
};

export const getKnowledgeStoreByName = async (name: string) => {
  try {
    const [knowledgeStore] = await db
      .select()
      .from(knowledgeStoresTable)
      .where(eq(knowledgeStoresTable.name, name));
    return knowledgeStore || null;
  } catch (error) {
    console.error("Error getting knowledge store:", error);
    throw error;
  }
};

export const updateKnowledgeStore = async (
  name: string,
  updates: Partial<typeof knowledgeStoresTable.$inferInsert>,
) => {
  try {
    const [updatedKnowledgeStore] = await db
      .update(knowledgeStoresTable)
      .set(updates)
      .where(eq(knowledgeStoresTable.name, name))
      .returning();
    return updatedKnowledgeStore;
  } catch (error) {
    console.error("Error updating knowledge store:", error);
    throw error;
  }
};

export const deleteKnowledgeStore = async (name: string) => {
  try {
    const [deletedKnowledgeStore] = await db
      .delete(knowledgeStoresTable)
      .where(eq(knowledgeStoresTable.name, name))
      .returning();
    return deletedKnowledgeStore;
  } catch (error) {
    console.error("Error deleting knowledge store:", error);
    throw error;
  }
};

export const listAllKnowledgeStores = async () => {
  try {
    const knowledgeStores = await db
      .select()
      .from(knowledgeStoresTable)
      .execute();
    return knowledgeStores;
  } catch (error) {
    console.error("Error listing knowledge stores:", error);
    throw error;
  }
};
