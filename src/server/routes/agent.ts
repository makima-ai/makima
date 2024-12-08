import { Elysia, error, t } from "elysia";
import {
  createAgent,
  updateAgent,
  deleteAgent,
  listAllAgents,
  getToolByName,
  getAgentByName,
  addToolToAgentByName,
  removeToolFromAgentByName,
  addHelperAgentByName,
  removeHelperAgentByName,
} from "../../db/agent";
import {
  addKnowledgeBaseToAgentByName,
  removeKnowledgeBaseFromAgentByName,
} from "../../db/agent-knowledge";
import { getKnowledgeBaseByName } from "../../db/knowledge";
import type { UserMessage } from "../../lib/inference/types";
import { agentInfer } from "../../lib/agent";
import { handle, log } from "../../lib/utils";

export const agentRoute = new Elysia({ prefix: "/agent" })
  .get(
    "/",
    async () => {
      const [agents, err] = await handle(listAllAgents());
      if (err) {
        log.error(err.message);
        return error(500, "Error getting agents");
      }
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
      const [agent, err] = await handle(getAgentByName(name));
      if (err) {
        log.error(err.message);
        return error(500, "Error getting agent");
      }
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
      const [newAgent, err] = await handle(createAgent(body));
      if (err) {
        log.error(err.message);
        return error(500, "Error creating agent");
      }
      return newAgent;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
        description: t.Optional(t.String({ maxLength: 255 })),
        prompt: t.String({ minLength: 4 }),
        primaryModel: t.String({ minLength: 4 }),
        fallbackModels: t.Optional(t.Array(t.String({ minLength: 4 }))),
        format: t.Optional(t.Literal("json")),
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
      const [updatedAgent, err] = await handle(updateAgent(name, body));
      if (err) {
        log.error(err.message);
        return error(500, "Error updating agent");
      }
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
        format: t.Optional(t.Literal("json")),
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
      const [deletedAgent, err] = await handle(deleteAgent(name));
      if (err) {
        log.error(err.message);
        return error(500, "Error deleting agent");
      }
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

  // Agent inference (temporary chat)
  .post(
    "/:agentName/chat",
    async ({ params: { agentName }, body }) => {
      const message = body;
      const [result, err] = await handle(
        agentInfer({
          agentName,
          newMessage: message as UserMessage,
        }),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error during agent inference");
      }
      return result;
    },
    {
      params: t.Object({
        agentName: t.String({ minLength: 3, maxLength: 255 }),
      }),
      body: t.Object({
        role: t.Literal("human", { default: "human" }),
        name: t.String({ minLength: 3, maxLength: 255 }),
        content: t.Union(
          [
            t.String({ minLength: 1 }),
            t.Array(
              t.Object({
                url: t.String({ minLength: 1 }),
                type: t.Union([t.Literal("image"), t.Literal("audio")]),
                detail: t.Optional(
                  t.Union([
                    t.Literal("auto"),
                    t.Literal("low"),
                    t.Literal("high"),
                  ]),
                ),
                format: t.Optional(
                  t.Union([t.Literal("wav"), t.Literal("mp3")]),
                ),
              }),
            ),
          ],
          {
            default: "",
          },
        ),
        attachments: t.Optional(
          t.Array(
            t.Object({
              type: t.String(),
              data: t.Union([t.String(), t.Any()]),
            }),
          ),
        ),
      }),

      detail: {
        summary: "Agent inference (chat)",
        description:
          "Performs inference with an agent with a one time message. This inference call will not keep history, to use history use the thread inference endpoint.",
        tags: ["Agent"],
      },
    },
  )
  // Add helper agent
  .post(
    "/:agentName/add-helper/:helperAgentName",
    async ({ params: { agentName, helperAgentName }, error }) => {
      const [agent, err1] = await handle(getAgentByName(agentName));
      if (err1) {
        log.error(err1.message);
        return error(500, "Error getting agent");
      }
      if (!agent) {
        return error(404, "Agent not found");
      }

      const [helperAgent, err2] = await handle(getAgentByName(helperAgentName));
      if (err2) {
        log.error(err2.message);
        return error(500, "Error getting helper agent");
      }
      if (!helperAgent) {
        return error(404, "Helper agent not found");
      }

      const [updatedAgent, err3] = await handle(
        addHelperAgentByName(agentName, helperAgentName),
      );
      if (err3) {
        log.error(err3.message);
        return error(500, "Error adding helper agent");
      }
      return updatedAgent;
    },
    {
      params: t.Object({
        agentName: t.String({ minLength: 4, maxLength: 255 }),
        helperAgentName: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Add helper agent",
        description:
          "Adds a helper agent to an agent by their names. This operation allows the main agent to use the helper agent's capabilities.",
        tags: ["Agent"],
      },
    },
  )

  // Remove helper agent
  .post(
    "/:agentName/remove-helper/:helperAgentName",
    async ({ params: { agentName, helperAgentName }, error }) => {
      const [[agent, err1], [helperAgent, err2]] = await Promise.all([
        handle(getAgentByName(agentName)),
        handle(getAgentByName(helperAgentName)),
      ]);

      if (err1) {
        log.error(err1.message);
        return error(500, "Error getting agent");
      }
      if (!agent) {
        return error(404, "Agent not found");
      }

      if (err2) {
        log.error(err2.message);
        return error(500, "Error getting helper agent");
      }
      if (!helperAgent) {
        return error(404, "Helper agent not found");
      }

      const [updatedAgent, err3] = await handle(
        removeHelperAgentByName(agentName, helperAgentName),
      );
      if (err3) {
        log.error(err3.message);
        return error(500, "Error removing helper agent");
      }
      return updatedAgent;
    },
    {
      params: t.Object({
        agentName: t.String({ minLength: 4, maxLength: 255 }),
        helperAgentName: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Remove helper agent",
        description:
          "Removes a helper agent from an agent by their names. This operation removes the main agent's ability to use the helper agent's capabilities.",
        tags: ["Agent"],
      },
    },
  )
  // Add tool to agent
  .post(
    "/:agentName/add-tool/:toolName",
    async ({ params: { agentName, toolName }, error }) => {
      const [[agent, err1], [tool, err2]] = await Promise.all([
        handle(getAgentByName(agentName)),
        handle(getToolByName(toolName)),
      ]);

      if (err1) {
        log.error(err1.message);
        return error(500, "Error getting agent");
      }
      if (!agent) {
        return error(404, "Agent not found");
      }

      if (err2) {
        log.error(err2.message);
        return error(500, "Error getting tool");
      }
      if (!tool) {
        return error(404, "Tool not found");
      }

      const [updatedAgent, err3] = await handle(
        addToolToAgentByName(agentName, toolName),
      );
      if (err3) {
        log.error(err3.message);
        return error(500, "Error adding tool to agent");
      }
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
      const [[agent, err1], [tool, err2]] = await Promise.all([
        handle(getAgentByName(agentName)),
        handle(getToolByName(toolName)),
      ]);

      if (err1) {
        log.error(err1.message);
        return error(500, "Error getting agent");
      }
      if (!agent) {
        return error(404, "Agent not found");
      }

      if (err2) {
        log.error(err2.message);
        return error(500, "Error getting tool");
      }
      if (!tool) {
        return error(404, "Tool not found");
      }

      const [updatedAgent, err3] = await handle(
        removeToolFromAgentByName(agentName, toolName),
      );
      if (err3) {
        log.error(err3.message);
        return error(500, "Error removing tool from agent");
      }
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
      const [[agent, err1], [knowledgeBase, err2]] = await Promise.all([
        handle(getAgentByName(agentName)),
        handle(getKnowledgeBaseByName(knowledgeBaseName)),
      ]);

      if (err1) {
        log.error(err1.message);
        return error(500, "Error getting agent");
      }
      if (!agent) {
        return error(404, "Agent not found");
      }

      if (err2) {
        log.error(err2.message);
        return error(500, "Error getting knowledge base");
      }
      if (!knowledgeBase) {
        return error(404, "Knowledge base not found");
      }

      const [updatedAgent, err3] = await handle(
        addKnowledgeBaseToAgentByName(agentName, knowledgeBaseName),
      );
      if (err3) {
        log.error(err3.message);
        return error(500, "Error adding knowledge base to agent");
      }
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
      const [[agent, err1], [knowledgeBase, err2]] = await Promise.all([
        handle(getAgentByName(agentName)),
        handle(getKnowledgeBaseByName(knowledgeBaseName)),
      ]);

      if (err1) {
        log.error(err1.message);
        return error(500, "Error getting agent");
      }
      if (!agent) {
        return error(404, "Agent not found");
      }

      if (err2) {
        log.error(err2.message);
        return error(500, "Error getting knowledge base");
      }
      if (!knowledgeBase) {
        return error(404, "Knowledge base not found");
      }

      const [updatedAgent, err3] = await handle(
        removeKnowledgeBaseFromAgentByName(agentName, knowledgeBaseName),
      );
      if (err3) {
        log.error(err3.message);
        return error(500, "Error removing knowledge base from agent");
      }
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
