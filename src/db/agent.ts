import { db } from "../db";
import { eq, and } from "drizzle-orm";
import {
  agentsTable,
  toolsTable,
  agentToolsTable,
  knowledgeBaseTable,
  agentKnowledgeBasesTable,
  agentHelperTable,
} from "./schema";
import type { Agent } from "../lib/inference/types";
import type { DbTool } from "../lib/thread/tool";

// Agent CRUD operations

export const createAgent = async (agent: {
  name: string;
  description?: string;
  prompt: string;
  primaryModel: string;
  fallbackModels?: string[];
}) => {
  try {
    const [newAgent] = await db.insert(agentsTable).values(agent).returning();
    return newAgent;
  } catch (error) {
    console.error("Error creating agent:", error);
    throw error;
  }
};

export const getAgentById = async (id: string): Promise<Agent | null> => {
  try {
    const [agent] = await db
      .select()
      .from(agentsTable)
      .where(eq(agentsTable.id, id));
    if (!agent) return null;

    // Existing queries remain the same
    const tools = await db
      .select({
        id: toolsTable.id,
        name: toolsTable.name,
        description: toolsTable.description,
        params: toolsTable.params,
        endpoint: toolsTable.endpoint,
        method: toolsTable.method,
        createdAt: toolsTable.createdAt,
      })
      .from(agentToolsTable)
      .innerJoin(toolsTable, eq(agentToolsTable.toolId, toolsTable.id))
      .where(eq(agentToolsTable.agentId, agent.id));

    const knowledgeBases = await db
      .select({
        id: knowledgeBaseTable.id,
        name: knowledgeBaseTable.name,
        embedding_model: knowledgeBaseTable.embedding_model,
        models: knowledgeBaseTable.models,
        database_provider: knowledgeBaseTable.database_provider,
        description: knowledgeBaseTable.description,
      })
      .from(agentKnowledgeBasesTable)
      .innerJoin(
        knowledgeBaseTable,
        eq(agentKnowledgeBasesTable.knowledgeBaseId, knowledgeBaseTable.id),
      )
      .where(eq(agentKnowledgeBasesTable.agentId, id));

    // Add queries for helper agents
    const helperAgents = await db
      .select({
        id: agentsTable.id,
        name: agentsTable.name,
        description: agentsTable.description,
        prompt: agentsTable.prompt,
        primaryModel: agentsTable.primaryModel,
        fallbackModels: agentsTable.fallbackModels,
        createdAt: agentsTable.createdAt,
      })
      .from(agentHelperTable)
      .innerJoin(
        agentsTable,
        eq(agentHelperTable.helperAgentId, agentsTable.id),
      )
      .where(eq(agentHelperTable.mainAgentId, id));

    const usedByAgents = await db
      .select({
        id: agentsTable.id,
        name: agentsTable.name,
        description: agentsTable.description,
        prompt: agentsTable.prompt,
        primaryModel: agentsTable.primaryModel,
        fallbackModels: agentsTable.fallbackModels,
        createdAt: agentsTable.createdAt,
      })
      .from(agentHelperTable)
      .innerJoin(agentsTable, eq(agentHelperTable.mainAgentId, agentsTable.id))
      .where(eq(agentHelperTable.helperAgentId, id));

    return { ...agent, tools, knowledgeBases, helperAgents, usedByAgents };
  } catch (error) {
    console.error("Error getting agent:", error);
    throw error;
  }
};

// Update the getAgentByName function similarly
export const getAgentByName = async (name: string): Promise<Agent | null> => {
  try {
    const [agent] = await db
      .select()
      .from(agentsTable)
      .where(eq(agentsTable.name, name));
    if (!agent) return null;

    // Existing queries remain the same
    const tools = await db
      .select({
        id: toolsTable.id,
        name: toolsTable.name,
        description: toolsTable.description,
        params: toolsTable.params,
        endpoint: toolsTable.endpoint,
        method: toolsTable.method,
        createdAt: toolsTable.createdAt,
      })
      .from(agentToolsTable)
      .innerJoin(toolsTable, eq(agentToolsTable.toolId, toolsTable.id))
      .where(eq(agentToolsTable.agentId, agent.id));

    const knowledgeBases = await db
      .select({
        id: knowledgeBaseTable.id,
        name: knowledgeBaseTable.name,
        embedding_model: knowledgeBaseTable.embedding_model,
        models: knowledgeBaseTable.models,
        database_provider: knowledgeBaseTable.database_provider,
        description: knowledgeBaseTable.description,
      })
      .from(agentKnowledgeBasesTable)
      .innerJoin(
        knowledgeBaseTable,
        eq(agentKnowledgeBasesTable.knowledgeBaseId, knowledgeBaseTable.id),
      )
      .where(eq(agentKnowledgeBasesTable.agentId, agent.id));

    // Add queries for helper agents
    const helperAgents = await db
      .select({
        id: agentsTable.id,
        name: agentsTable.name,
        description: agentsTable.description,
        prompt: agentsTable.prompt,
        primaryModel: agentsTable.primaryModel,
        fallbackModels: agentsTable.fallbackModels,
        createdAt: agentsTable.createdAt,
      })
      .from(agentHelperTable)
      .innerJoin(
        agentsTable,
        eq(agentHelperTable.helperAgentId, agentsTable.id),
      )
      .where(eq(agentHelperTable.mainAgentId, agent.id));

    const usedByAgents = await db
      .select({
        id: agentsTable.id,
        name: agentsTable.name,
        description: agentsTable.description,
        prompt: agentsTable.prompt,
        primaryModel: agentsTable.primaryModel,
        fallbackModels: agentsTable.fallbackModels,
        createdAt: agentsTable.createdAt,
      })
      .from(agentHelperTable)
      .innerJoin(agentsTable, eq(agentHelperTable.mainAgentId, agentsTable.id))
      .where(eq(agentHelperTable.helperAgentId, agent.id));

    return {
      ...agent,
      tools,
      knowledgeBases,
      helperAgents,
      usedByAgents,
    };
  } catch (error) {
    console.error("Error getting agent:", error);
    throw error;
  }
};

export const updateAgent = async (
  name: string,
  updates: Partial<typeof agentsTable.$inferInsert>,
) => {
  try {
    const [updatedAgent] = await db
      .update(agentsTable)
      .set(updates)
      .where(eq(agentsTable.name, name))
      .returning();
    return updatedAgent;
  } catch (error) {
    console.error("Error updating agent:", error);
    throw error;
  }
};

export const deleteAgent = async (name: string) => {
  try {
    const [deletedAgent] = await db
      .delete(agentsTable)
      .where(eq(agentsTable.name, name))
      .returning();
    return deletedAgent;
  } catch (error) {
    console.error("Error deleting agent:", error);
    throw error;
  }
};

export const getAgentTools = async (agentIdOrName: string) => {
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

    const tools = await db
      .select({
        id: toolsTable.id,
        name: toolsTable.name,
        description: toolsTable.description,
        params: toolsTable.params,
        endpoint: toolsTable.endpoint,
        method: toolsTable.method,
        createdAt: toolsTable.createdAt,
      })
      .from(agentToolsTable)
      .innerJoin(toolsTable, eq(agentToolsTable.toolId, toolsTable.id))
      .where(eq(agentToolsTable.agentId, agent.id));

    return tools;
  } catch (error) {
    console.error("Error getting agent tools:", error);
    throw error;
  }
};

// Agent to agent relationship operations

export const addHelperAgent = async (
  mainAgentId: string,
  helperAgentId: string,
) => {
  try {
    await db.insert(agentHelperTable).values({
      mainAgentId,
      helperAgentId,
    });
    return await getAgentById(mainAgentId);
  } catch (error) {
    console.error("Error adding helper agent:", error);
    throw error;
  }
};

export const addHelperAgentByName = async (
  mainAgentName: string,
  helperAgentName: string,
) => {
  try {
    const mainAgent = await getAgentByName(mainAgentName);
    if (!mainAgent) {
      throw new Error("Main agent not found");
    }

    const helperAgent = await getAgentByName(helperAgentName);
    if (!helperAgent) {
      throw new Error("Helper agent not found");
    }

    await db.insert(agentHelperTable).values({
      mainAgentId: mainAgent.id,
      helperAgentId: helperAgent.id,
    });
    return await getAgentById(mainAgent.id);
  } catch (error) {
    console.error("Error adding helper agent by name:", error);
    throw error;
  }
};

export const removeHelperAgent = async (
  mainAgentId: string,
  helperAgentId: string,
) => {
  try {
    await db
      .delete(agentHelperTable)
      .where(
        and(
          eq(agentHelperTable.mainAgentId, mainAgentId),
          eq(agentHelperTable.helperAgentId, helperAgentId),
        ),
      );
    return await getAgentById(mainAgentId);
  } catch (error) {
    console.error("Error removing helper agent:", error);
    throw error;
  }
};

export const removeHelperAgentByName = async (
  mainAgentName: string,
  helperAgentName: string,
) => {
  try {
    const mainAgent = await getAgentByName(mainAgentName);
    if (!mainAgent) {
      throw new Error("Main agent not found");
    }

    const helperAgent = await getAgentByName(helperAgentName);
    if (!helperAgent) {
      throw new Error("Helper agent not found");
    }

    await db
      .delete(agentHelperTable)
      .where(
        and(
          eq(agentHelperTable.mainAgentId, mainAgent.id),
          eq(agentHelperTable.helperAgentId, helperAgent.id),
        ),
      );
    return await getAgentById(mainAgent.id);
  } catch (error) {
    console.error("Error removing helper agent by name:", error);
    throw error;
  }
};

// Tool CRUD operations

export const createTool = async (tool: {
  name: string;
  description?: string;
  params?: any;
  endpoint: string;
  method: string;
}) => {
  try {
    const [newTool] = await db.insert(toolsTable).values(tool).returning();
    return newTool;
  } catch (error) {
    console.error("Error creating tool:", error);
    throw error;
  }
};

export const getToolById = async (id: string) => {
  try {
    const [tool] = await db
      .select()
      .from(toolsTable)
      .where(eq(toolsTable.id, id));
    return tool || null;
  } catch (error) {
    console.error("Error getting tool:", error);
    throw error;
  }
};

export const getToolByName = async (name: string) => {
  try {
    const [tool] = await db
      .select()
      .from(toolsTable)
      .where(eq(toolsTable.name, name));
    return tool || null;
  } catch (error) {
    console.error("Error getting tool:", error);
    throw error;
  }
};

export const updateTool = async (
  name: string,
  updates: Partial<typeof toolsTable.$inferInsert>,
) => {
  try {
    const [updatedTool] = await db
      .update(toolsTable)
      .set(updates)
      .where(eq(toolsTable.name, name))
      .returning();
    return updatedTool;
  } catch (error) {
    console.error("Error updating tool:", error);
    throw error;
  }
};

export const deleteTool = async (name: string) => {
  try {
    const [deletedTool] = await db
      .delete(toolsTable)
      .where(eq(toolsTable.name, name))
      .returning();
    return deletedTool;
  } catch (error) {
    console.error("Error deleting tool:", error);
    throw error;
  }
};

// Agent-Tool relationship operations

export const addToolToAgent = async (agentId: string, toolId: string) => {
  try {
    await db.insert(agentToolsTable).values({ agentId, toolId });
    return await getAgentById(agentId);
  } catch (error) {
    console.error("Error adding tool to agent:", error);
    throw error;
  }
};

export const addToolToAgentByName = async (
  agentName: string,
  toolName: string,
) => {
  try {
    const agent = await getAgentByName(agentName);
    if (!agent) {
      throw new Error("Agent not found");
    }

    const tool = await getToolByName(toolName);
    if (!tool) {
      throw new Error("Tool not found");
    }

    await db.insert(agentToolsTable).values({
      agentId: agent.id,
      toolId: tool.id,
    });
    return await getAgentById(agent.id);
  } catch (error) {
    console.error("Error adding tool to agent by name:", error);
    throw error;
  }
};

export const removeToolFromAgent = async (agentId: string, toolId: string) => {
  try {
    await db
      .delete(agentToolsTable)
      .where(
        and(
          eq(agentToolsTable.agentId, agentId),
          eq(agentToolsTable.toolId, toolId),
        ),
      );
    return await getAgentById(agentId);
  } catch (error) {
    console.error("Error removing tool from agent:", error);
    throw error;
  }
};

export const removeToolFromAgentByName = async (
  agentName: string,
  toolName: string,
) => {
  try {
    const agent = await getAgentByName(agentName);
    if (!agent) {
      throw new Error("Agent not found");
    }

    const tool = await getToolByName(toolName);
    if (!tool) {
      throw new Error("Tool not found");
    }

    await db
      .delete(agentToolsTable)
      .where(
        and(
          eq(agentToolsTable.agentId, agent.id),
          eq(agentToolsTable.toolId, tool.id),
        ),
      );
    return await getAgentById(agent.id);
  } catch (error) {
    console.error("Error removing tool from agent by name:", error);
    throw error;
  }
};

export const listAllAgents = async () => {
  try {
    const agents = await db.select().from(agentsTable).execute();
    return agents;
  } catch (error) {
    console.error("Error listing agents:", error);
    throw error;
  }
};

// New function to list all tools
export const listAllTools = async () => {
  try {
    const tools = await db.select().from(toolsTable).execute();
    return tools;
  } catch (error) {
    console.error("Error listing tools:", error);
    throw error;
  }
};
