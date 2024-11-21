import { Elysia, t } from "elysia";
import {
  createAgent,
  updateAgent,
  deleteAgent,
  createTool,
  updateTool,
  deleteTool,
  listAllAgents,
  listAllTools,
  getToolByName,
  getAgentByName,
  addToolToAgentByName,
  removeToolFromAgentByName,
} from "../../db/agent";
import {
  addKnowledgeBaseToAgentByName,
  removeKnowledgeBaseFromAgentByName,
} from "../../db/agent-knowledge";
import { getKnowledgeBaseByName } from "../../db/knowledge";

export const agentRoute = new Elysia({ prefix: "/agent" })
  .get(
    "/",
    async () => {
      const agents = await listAllAgents();
      return agents;
    },
    {
      detail: {
        summary: "Get all agents",
        description:
          "Get all agents in the system and their details such as name, description, prompt, primary model, fallback models, and tools.",
        tags: ["Agent"],
      },
    },
  )
  // Get agent by name
  .get(
    "/:name",
    async ({ params: { name }, error }) => {
      const agent = await getAgentByName(name);
      if (!agent) {
        return error(404, "Agent not found");
      }
      return {
        ...agent,
        tools: agent.tools || [],
      };
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Get agent by name",
        description:
          "Gets the details of an agent by its name. This response includes the tools associated with the agent along with the agent details such as name, description, prompt, primary model, and fallback models.",
        tags: ["Agent"],
      },
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
        name: t.String({ minLength: 4, maxLength: 255 }),
        description: t.Optional(t.String({ maxLength: 255 })),
        prompt: t.String({ minLength: 4 }),
        primaryModel: t.String({ minLength: 4 }),
        fallbackModels: t.Optional(t.Array(t.String({ minLength: 4 }))),
      }),
      detail: {
        summary: "Create a new agent",
        description:
          "Creates a new agent with the provided details. The agent details include the agent name, description, prompt, primary model, fallback models, and tools associated with the agent. These details are required to create a new agent.",
        tags: ["Agent"],
      },
    },
  )

  // update agent by name
  .put(
    "/:name",
    async ({ params: { name }, body, error }) => {
      const updatedAgent = await updateAgent(name, body);
      if (!updatedAgent) {
        return error(404, "Agent not found");
      }
      return updatedAgent;
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 4, maxLength: 255 })),
        description: t.Optional(t.String({ maxLength: 255 })),
        prompt: t.Optional(t.String({ minLength: 4 })),
        primaryModel: t.Optional(t.String({ minLength: 4 })),
        fallbackModels: t.Optional(t.Array(t.String({ minLength: 4 }))),
      }),
      detail: {
        summary: "Update an agent by name",
        description:
          "Updates the details of an existing agent by its name. The agent details include the agent name, description, prompt, primary model, fallback models, and tools associated with the agent. These details are required to update an existing agent. whatever different details are provided will be updated.",
        tags: ["Agent"],
      },
    },
  )

  // Delete an agent
  .delete(
    "/:name",
    async ({ params: { name }, error }) => {
      const deletedAgent = await deleteAgent(name);
      if (!deletedAgent) {
        return error(404, "Agent not found");
      }
      return { message: "Agent deleted successfully" };
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Delete an agent by name",
        description:
          "Deletes an agent by its name. This operation is irreversible and will delete all the details associated with the agent, including the tools associated with the agent.",
        tags: ["Agent"],
      },
    },
  )

  // Add tool to agent
  .post(
    "/:agentName/add-tool/:toolName",
    async ({ params: { agentName, toolName }, error }) => {
      const agent = await getAgentByName(agentName);
      if (!agent) {
        return error(404, "Agent not found");
      }

      const tool = await getToolByName(toolName);

      if (!tool) {
        return error(404, "Tool not found");
      }

      const updatedAgent = await addToolToAgentByName(agentName, toolName);
      return updatedAgent;
    },
    {
      params: t.Object({
        agentName: t.String({ minLength: 4, maxLength: 255 }),
        toolName: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Add tool to agent",
        description:
          "Adds a tool to an agent by the agent name and tool name. This operation is used to associate a tool with an agent.",
        tags: ["Agent"],
      },
    },
  )

  // Remove tool from agent
  .post(
    "/:agentName/remove-tool/:toolName",
    async ({ params: { agentName, toolName }, error }) => {
      const agent = await getAgentByName(agentName);
      if (!agent) {
        return error(404, "Agent not found");
      }

      const tool = await getToolByName(toolName);
      if (!tool) {
        return error(404, "Tool not found");
      }

      const updatedAgent = await removeToolFromAgentByName(agentName, toolName);
      return updatedAgent;
    },
    {
      params: t.Object({
        agentName: t.String({ minLength: 4, maxLength: 255 }),
        toolName: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Remove tool from agent",
        description:
          "Removes a tool from an agent by the agent name and tool name. This operation is used to disassociate a tool from an agent.",
        tags: ["Agent"],
      },
    },
  )
  .post(
    "/:agentName/add-knowledge-base/:knowledgeBaseName",
    async ({ params: { agentName, knowledgeBaseName }, error }) => {
      const agent = await getAgentByName(agentName);
      if (!agent) {
        return error(404, "Agent not found");
      }

      const knowledgeBase = await getKnowledgeBaseByName(knowledgeBaseName);
      if (!knowledgeBase) {
        return error(404, "Knowledge base not found");
      }

      const updatedAgent = await addKnowledgeBaseToAgentByName(
        agentName,
        knowledgeBaseName,
      );
      return updatedAgent;
    },
    {
      params: t.Object({
        agentName: t.String({ minLength: 4, maxLength: 255 }),
        knowledgeBaseName: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Add knowledge base to agent",
        description:
          "Adds a knowledge base to an agent by the agent name and knowledge base name. This operation is used to associate a knowledge base with an agent.",
        tags: ["Agent"],
      },
    },
  )

  // Remove knowledge base from agent
  .post(
    "/:agentName/remove-knowledge-base/:knowledgeBaseName",
    async ({ params: { agentName, knowledgeBaseName }, error }) => {
      const agent = await getAgentByName(agentName);
      if (!agent) {
        return error(404, "Agent not found");
      }

      const knowledgeBase = await getKnowledgeBaseByName(knowledgeBaseName);
      if (!knowledgeBase) {
        return error(404, "Knowledge base not found");
      }

      const updatedAgent = await removeKnowledgeBaseFromAgentByName(
        agentName,
        knowledgeBaseName,
      );
      return updatedAgent;
    },
    {
      params: t.Object({
        agentName: t.String({ minLength: 4, maxLength: 255 }),
        knowledgeBaseName: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Remove knowledge base from agent",
        description:
          "Removes a knowledge base from an agent by the agent name and knowledge base name. This operation is used to disassociate a knowledge base from an agent.",
        tags: ["Agent"],
      },
    },
  );

export const toolRoute = new Elysia({ prefix: "/tool" })
  .get(
    "/",
    async () => {
      const tools = await listAllTools();
      return tools;
    },
    {
      detail: {
        summary: "Get all tools",
        description:
          "Get all tools in the system and their details such as name, description, endpoint, method, and parameters.",
        tags: ["Tool"],
      },
    },
  )
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
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Get tool by name",
        description:
          "Gets the details of a tool by its name. This response includes the tool details such as name, description, endpoint, method, and parameters.",
        tags: ["Tool"],
      },
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
        name: t.String({ minLength: 4, maxLength: 255 }),
        description: t.Optional(t.String({ maxLength: 255 })),
        params: t.Optional(t.Any()),
        endpoint: t.String({ minLength: 4 }),
        method: t.String({ minLength: 1 }),
      }),
      detail: {
        summary: "Create a new tool",
        description:
          "Creates a new tool with the provided details. The tool details include the tool name, description, parameters, endpoint, and method. These details are required to create a new tool.",
        tags: ["Tool"],
      },
    },
  )

  // Update a tool
  .put(
    "/:name",
    async ({ params: { name }, body, error }) => {
      const updatedTool = await updateTool(name, body);
      if (!updatedTool) {
        return error(404, "Tool not found");
      }
      return updatedTool;
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 4, maxLength: 255 })),
        description: t.Optional(t.String({ maxLength: 255 })),
        params: t.Optional(t.Any()),
        endpoint: t.Optional(t.String({ minLength: 4 })),
        method: t.Optional(t.String({ minLength: 1 })),
      }),
      detail: {
        summary: "Update a tool by name",
        description:
          "Updates the details of an existing tool by its name. The tool details include the tool name, description, parameters, endpoint, and method. These details are required to update an existing tool. whatever different details are provided will be updated.",
        tags: ["Tool"],
      },
    },
  )

  // Delete a tool
  .delete(
    "/:name",
    async ({ params: { name }, error }) => {
      const deletedTool = await deleteTool(name);
      if (!deletedTool) {
        return error(404, "Tool not found");
      }
      return { message: "Tool deleted successfully" };
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Delete a tool by name",
        description:
          "Deletes a tool by its name. This operation is irreversible and will delete all the details associated with the tool.",
        tags: ["Tool"],
      },
    },
  );
