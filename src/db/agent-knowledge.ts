import { db } from "../db";
import { eq, and } from "drizzle-orm";
import {
  agentsTable,
  knowledgeBaseTable,
  agentKnowledgeBasesTable,
} from "./schema";
import { getAgentById, getAgentByName } from "./agent";
import { getKnowledgeBaseByName } from "./knowledge";

// Agent-KnowledgeBase relationship operations

export const addKnowledgeBaseToAgent = async (
  agentId: string,
  knowledgeBaseId: string,
) => {
  try {
    await db
      .insert(agentKnowledgeBasesTable)
      .values({ agentId, knowledgeBaseId });
    return await getAgentById(agentId);
  } catch (error) {
    console.error("Error adding knowledge base to agent:", error);
    throw error;
  }
};

export const addKnowledgeBaseToAgentByName = async (
  agentName: string,
  knowledgeBaseName: string,
) => {
  try {
    const agent = await getAgentByName(agentName);
    if (!agent) {
      throw new Error("Agent not found");
    }

    const knowledgeBase = await getKnowledgeBaseByName(knowledgeBaseName);
    if (!knowledgeBase) {
      throw new Error("Knowledge base not found");
    }

    await db.insert(agentKnowledgeBasesTable).values({
      agentId: agent.id,
      knowledgeBaseId: knowledgeBase.id,
    });
    return await getAgentById(agent.id);
  } catch (error) {
    console.error("Error adding knowledge base to agent by name:", error);
    throw error;
  }
};

export const removeKnowledgeBaseFromAgent = async (
  agentId: string,
  knowledgeBaseId: string,
) => {
  try {
    await db
      .delete(agentKnowledgeBasesTable)
      .where(
        and(
          eq(agentKnowledgeBasesTable.agentId, agentId),
          eq(agentKnowledgeBasesTable.knowledgeBaseId, knowledgeBaseId),
        ),
      );
    return await getAgentById(agentId);
  } catch (error) {
    console.error("Error removing knowledge base from agent:", error);
    throw error;
  }
};

export const removeKnowledgeBaseFromAgentByName = async (
  agentName: string,
  knowledgeBaseName: string,
) => {
  try {
    const agent = await getAgentByName(agentName);
    if (!agent) {
      throw new Error("Agent not found");
    }

    const knowledgeBase = await getKnowledgeBaseByName(knowledgeBaseName);
    if (!knowledgeBase) {
      throw new Error("Knowledge base not found");
    }

    await db
      .delete(agentKnowledgeBasesTable)
      .where(
        and(
          eq(agentKnowledgeBasesTable.agentId, agent.id),
          eq(agentKnowledgeBasesTable.knowledgeBaseId, knowledgeBase.id),
        ),
      );
    return await getAgentById(agent.id);
  } catch (error) {
    console.error("Error removing knowledge base from agent by name:", error);
    throw error;
  }
};

export const getAgentKnowledgeBases = async (agentIdOrName: string) => {
  try {
    let agent;
    if (agentIdOrName.length === 36) {
      // Assuming UUID length for id
      [agent] = await db
        .select()
        .from(agentsTable)
        .where(eq(agentsTable.id, agentIdOrName));
    } else {
      [agent] = await db
        .select()
        .from(agentsTable)
        .where(eq(agentsTable.name, agentIdOrName));
    }

    if (!agent) {
      throw new Error("Agent not found");
    }

    const knowledgeBases = await db
      .select({
        id: knowledgeBaseTable.id,
        name: knowledgeBaseTable.name,
        embedding_model: knowledgeBaseTable.embedding_model,
        models: knowledgeBaseTable.models,
        database_provider: knowledgeBaseTable.database_provider,
        description: knowledgeBaseTable.description,
        createdAt: knowledgeBaseTable.createdAt,
      })
      .from(agentKnowledgeBasesTable)
      .innerJoin(
        knowledgeBaseTable,
        eq(agentKnowledgeBasesTable.knowledgeBaseId, knowledgeBaseTable.id),
      )
      .where(eq(agentKnowledgeBasesTable.agentId, agent.id));

    return knowledgeBases;
  } catch (error) {
    console.error("Error getting agent knowledge bases:", error);
    throw error;
  }
};
