import { db } from "../db";
import { eq, and } from "drizzle-orm";
import { agentsTable, toolsTable, agentToolsTable } from "./schema";

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

export const getAgentById = async (id: string) => {
  try {
    const [agent] = await db
      .select()
      .from(agentsTable)
      .where(eq(agentsTable.id, id));
    if (!agent) return null;

    const tools = await db
      .select({
        id: toolsTable.id,
        name: toolsTable.name,
        description: toolsTable.description,
      })
      .from(agentToolsTable)
      .innerJoin(toolsTable, eq(agentToolsTable.toolId, toolsTable.id))
      .where(eq(agentToolsTable.agentId, id));

    return { ...agent, tools };
  } catch (error) {
    console.error("Error getting agent:", error);
    throw error;
  }
};

export const getAgentByName = async (name: string) => {
  try {
    const [agent] = await db
      .select()
      .from(agentsTable)
      .where(eq(agentsTable.name, name));
    if (!agent) return null;

    const tools = await db
      .select({
        id: toolsTable.id,
        name: toolsTable.name,
        description: toolsTable.description,
      })
      .from(agentToolsTable)
      .innerJoin(toolsTable, eq(agentToolsTable.toolId, toolsTable.id))
      .where(eq(agentToolsTable.agentId, agent.id));

    return { ...agent, tools };
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
  id: string,
  updates: Partial<typeof toolsTable.$inferInsert>,
) => {
  try {
    const [updatedTool] = await db
      .update(toolsTable)
      .set(updates)
      .where(eq(toolsTable.id, id))
      .returning();
    return updatedTool;
  } catch (error) {
    console.error("Error updating tool:", error);
    throw error;
  }
};

export const deleteTool = async (id: string) => {
  try {
    const [deletedTool] = await db
      .delete(toolsTable)
      .where(eq(toolsTable.id, id))
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
