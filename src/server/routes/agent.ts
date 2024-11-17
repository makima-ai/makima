import { Elysia, t } from "elysia";
import {
  getAgentById,
  createAgent,
  updateAgent,
  deleteAgent,
  addToolToAgent,
  removeToolFromAgent,
  getToolById,
  createTool,
  updateTool,
  deleteTool,
  listAllAgents,
  listAllTools,
  getToolByName,
} from "../../db/agent";

export const agentRoute = new Elysia({ prefix: "/agent" })
  .get("/", async () => {
    const agents = await listAllAgents();
    return agents;
  })
  // Get agent by ID
  .get(
    "/:id",
    async ({ params: { id } }) => {
      const agent = await getAgentById(id);
      if (!agent) {
        return { error: "Agent not found" };
      }
      return {
        ...agent,
        tools: agent.tools || [],
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Create a new agent
  .post(
    "/create",
    async ({ body }) => {
      const newAgent = await createAgent(body);
      return newAgent;
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        prompt: t.String(),
        primaryModel: t.String(),
        fallbackModels: t.Optional(t.Array(t.String())),
        tools: t.Optional(t.Array(t.String())),
      }),
    },
  )

  // Update an agent
  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      const updatedAgent = await updateAgent(id, body);
      if (!updatedAgent) {
        return { error: "Agent not found" };
      }
      return updatedAgent;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        prompt: t.Optional(t.String()),
        primaryModel: t.Optional(t.String()),
        fallbackModels: t.Optional(t.Array(t.String())),
        tools: t.Optional(t.Array(t.String())),
      }),
    },
  )

  // Delete an agent
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      const deletedAgent = await deleteAgent(id);
      if (!deletedAgent) {
        return { error: "Agent not found" };
      }
      return { message: "Agent deleted successfully" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // Add tool to agent
  .post(
    "/:id/add-tool/:toolId",
    async ({ params: { id, toolId } }) => {
      const updatedAgent = await addToolToAgent(id, toolId);
      return updatedAgent;
    },
    {
      params: t.Object({
        id: t.String(),
        toolId: t.String(),
      }),
    },
  )

  // Remove tool from agent
  .post(
    "/:id/remove-tool/:toolId",
    async ({ params: { id, toolId } }) => {
      const updatedAgent = await removeToolFromAgent(id, toolId);
      return updatedAgent;
    },
    {
      params: t.Object({
        id: t.String(),
        toolId: t.String(),
      }),
    },
  );

export const toolRoute = new Elysia({ prefix: "/tool" })
  .get("/", async () => {
    const tools = await listAllTools();
    return tools;
  })
  // Get tool by name
  .get(
    "/:name",
    async ({ params: { name }, error }) => {
      const tool = await getToolByName(name);
      if (!tool) {
        return error(404, "Tool not found");
      }
      return tool;
    },
    {
      params: t.Object({
        name: t.String(),
      }),
    },
  )

  // Create a new tool
  .post(
    "/create",
    async ({ body }) => {
      const newTool = await createTool(body);
      return newTool;
    },
    {
      body: t.Object({
        name: t.String(),
        description: t.Optional(t.String()),
        params: t.Optional(t.Any()),
        endpoint: t.String(),
        method: t.String(),
      }),
    },
  )

  // Update a tool
  .put(
    "/:id",
    async ({ params: { id }, body }) => {
      const updatedTool = await updateTool(id, body);
      if (!updatedTool) {
        return { error: "Tool not found" };
      }
      return updatedTool;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String()),
        description: t.Optional(t.String()),
        params: t.Optional(t.Any()),
        endpoint: t.Optional(t.String()),
        method: t.Optional(t.String()),
      }),
    },
  )

  // Delete a tool
  .delete(
    "/:id",
    async ({ params: { id } }) => {
      const deletedTool = await deleteTool(id);
      if (!deletedTool) {
        return { error: "Tool not found" };
      }
      return { message: "Tool deleted successfully" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
