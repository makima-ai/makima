import type { toolsTable } from "../../db/schema";
import { Tool } from "../inference/tool";
import { searchKnowledgeBase } from "../knowledge";
import type { KnowledgeBase } from "../knowledge/types";
import type { Agent, Message, SystemMessage } from "../inference/types";
import { universalInfer } from "../inference";
import { t } from "elysia";

// Infer the type of the database tool from the Drizzle schema
export type DbTool = typeof toolsTable.$inferSelect;

export type ToolContext = {
  platform: string;
  latestMessage: Message;
  authorId: string;
};

// Function to convert a database tool to a Tool instance
export function createToolFromDb(dbTool: DbTool, context: ToolContext): Tool {
  return new Tool({
    name: dbTool.name,
    description: dbTool.description || dbTool.name,
    params: dbTool.params as any,
    function: async (params: unknown) => {
      console.log("Calling tool API:", dbTool.endpoint, params);

      if (typeof params !== "object") {
        console.error("Invalid parameters:", params);
        throw new Error("Invalid parameters");
      }

      const parsedParams = (params || {}) as Record<string, unknown>;

      try {
        // Prepare the request options
        const options: RequestInit = {
          method: dbTool.method.toUpperCase(),
          headers: {
            "Content-Type": "application/json",
          },
        };

        let url = dbTool.endpoint;

        if (["POST", "PUT", "PATCH"].includes(dbTool.method.toUpperCase())) {
          // Include context and payload in the request body
          const bodyPayload = {
            context: {
              platform: context.platform,
              latestMessage: context.latestMessage,
            },
            payload: parsedParams, // Send parsedParams under "payload" key
          };
          options.body = JSON.stringify(bodyPayload);
        } else if (dbTool.method.toUpperCase() === "GET") {
          // For GET requests, only send payload as query parameters
          const searchParams = new URLSearchParams();

          // Add payload as query parameters
          for (const [key, value] of Object.entries(parsedParams)) {
            searchParams.set(key, String(value));
          }

          const finalQueryString = searchParams.toString();
          if (finalQueryString) {
            url += `?${finalQueryString}`;
          }
        }

        // Make the API call
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the response
        const result = await response.json();
        const final = JSON.stringify(result);
        console.log("API response:", final);
        return final;
      } catch (error) {
        console.error("Error calling tool API:", error);
        throw error;
      }
    },
    parse: (params: string) => {
      console.log("Parsing params", params);
      const parsed = typeof params === "string" ? JSON.parse(params) : params;
      return parsed;
    },
    errorParser: (error: unknown) =>
      `Error: ${error instanceof Error ? error.message : String(error)}`,
  });
}

const paramsSchema = t.Object({
  query: t.String({
    description: "Query to search the knowledge base",
  }),
  k: t.String({
    default: "2",
    description: "Top k number of results to return",
  }),
});

export function createToolFromKB(kb: KnowledgeBase): Tool {
  const tool = new Tool({
    name: `search-knowledge-base-${kb.name}`,
    description: `Tool to Search knowledge base: ${kb.name}.
description: ${kb.description}`,
    params: paramsSchema,
    function: async (params: unknown) => {
      console.log("Searching knowledge base", kb.name, params);

      const parsed = paramsSchema.parse(params);

      try {
        const results = await searchKnowledgeBase(
          kb.name,
          parsed.query,
          Number(parsed.k),
        );
        const filtered = results.map((result) => {
          const words = result.content.split(" ");
          const isOverLimit = words.length > 1000;
          const limitedContent = words.slice(0, 1000).join(" ");
          if (isOverLimit) {
            console.log(
              `Content was over 1000 word limit: ${words.length} words truncated to 1000`,
            );
          }
          return {
            content: limitedContent,
            metadata: result.metadata,
          };
        });
        return JSON.stringify(filtered);
      } catch (error) {
        console.error("Error querying knowledge Base", error);
        throw error;
      }
    },
    parse: (params: string) => {
      console.log("Parsing params", params);
      const parsed = typeof params === "string" ? JSON.parse(params) : params;
      const valid = paramsSchema.parse(parsed);
      console.log("Valid params", valid);
      return valid;
    },
    errorParser: (error: unknown) =>
      `Error: ${error instanceof Error ? error.message : String(error)}`,
  });
  return tool;
}

const agentParamsSchema = t.Object({
  message: t.String({
    description: "Message to send the agent",
  }),
});

export function createToolFromAgent(
  agent: Agent,
  parentAgent: Agent,
  context: ToolContext,
): Tool {
  {
    const knowledgeBases = agent.knowledgeBases || [];
    const kbtools = knowledgeBases.map(createToolFromKB);
    const dbtools: DbTool[] = agent.tools || [];
    const registerd_tools = dbtools.map((t) => createToolFromDb(t, context));
    let tools = registerd_tools.concat(kbtools);

    return new Tool({
      name: `agent-${agent.name}`,
      description: `Tool to talk to: ${agent.name}
description: ${agent.description}
`,
      params: agentParamsSchema,
      function: async (params: unknown) => {
        console.log(agent.name, "is being called by", parentAgent.name);

        const parsed = agentParamsSchema.parse(params);

        console.log("Calling agent", agent.name, "with message", parsed);

        const systemMessage: SystemMessage = {
          role: "system",
          content: agent.prompt,
        };
        const newMessage: Message = {
          role: "ai",
          name: parentAgent.name,
          content: parsed.message,
        };
        const result = await universalInfer({
          model: agent.primaryModel,
          messages: [systemMessage, newMessage],
          tools: tools.length > 0 ? tools : undefined,
          format: agent.format || undefined,
        });
        return JSON.stringify(result);
      },
      parse: (params: string) => {
        console.log("Parsing params", params);
        const parsed = typeof params === "string" ? JSON.parse(params) : params;
        const valid = agentParamsSchema.parse(parsed);
        console.log("Valid params", valid);
        return valid;
      },
      errorParser: (error: unknown) =>
        `Error: ${error instanceof Error ? error.message : String(error)}`,
    });
  }
}
