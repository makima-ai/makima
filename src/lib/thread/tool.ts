import { z } from "zod";
import type { toolsTable } from "../../db/schema";
import { Tool } from "../inference/tool";
import { searchKnowledgeBase } from "../knowledge";
import type { KnowledgeBase } from "../knowledge/types";
import type { Agent, Message, SystemMessage } from "../inference/types";
import { universalInfer } from "../inference";
import zodToJsonSchema from "zod-to-json-schema";

// Infer the type of the database tool from the Drizzle schema
export type DbTool = typeof toolsTable.$inferSelect;

// Function to convert a database tool to a Tool instance
export function createToolFromDb(dbTool: DbTool): Tool {
  // Create the Tool instance
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
      params = (params || {}) as object;
      try {
        // Prepare the request options
        const options: RequestInit = {
          method: dbTool.method.toUpperCase(),
          headers: {
            "Content-Type": "application/json",
          },
        };

        // Add body for POST, PUT, PATCH methods
        if (["POST", "PUT", "PATCH"].includes(dbTool.method.toUpperCase())) {
          options.body = JSON.stringify(params);
        }

        // For GET requests, append params to URL
        let url = dbTool.endpoint;
        if (
          dbTool.method.toUpperCase() === "GET" &&
          Object.keys(params as object).length > 0
        ) {
          const searchParams = new URLSearchParams(params as any);
          url += `?${searchParams.toString()}`;
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

const paramsSchema = z.object({
  query: z.string().describe("Search query"),
  k: z.string().default("2").describe("Top k number of results to return"),
});

export function createToolFromKB(kb: KnowledgeBase): Tool {
  const tool = new Tool({
    name: `search-knowledge-base-${kb.name}`,
    description: `Tool to Search knowledge base: ${kb.name}.
description: ${kb.description}`,
    params: zodToJsonSchema(paramsSchema),
    function: async (params: unknown) => {
      console.log("Searching knowledge base", kb.name, params);

      const parsed = paramsSchema.parse(params);

      try {
        const results = await searchKnowledgeBase(
          kb.name,
          parsed.query,
          Number(parsed.k),
        );
        const filtered = results.map((result) => ({
          content: result.content,
          metadata: result.metadata,
        }));
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

const agentParamsSchema = z.object({
  message: z.string().describe("Message to send the agent"),
});

export function createToolFromAgent(agent: Agent, parentAgent: Agent) {
  const knowledgeBases = agent.knowledgeBases || [];
  const kbtools = knowledgeBases.map(createToolFromKB);
  const dbtools: DbTool[] = agent.tools || [];
  const registerd_tools = dbtools.map(createToolFromDb);
  let tools = registerd_tools.concat(kbtools);

  return new Tool({
    name: `agent-${agent.name}`,
    description: `Tool to talk to: ${agent.name}
description: ${agent.description}
`,
    params: zodToJsonSchema(agentParamsSchema),
    function: async (params: unknown) => {
      console.log(agent.name, "is being called by", parentAgent.name);

      const parsed = agentParamsSchema.parse(params);

      console.log("Calling agent", agent.name, "with message", parsed);

      const systemMessage: SystemMessage = {
        role: "system",
        content: agent.prompt,
      };
      const newMessage: Message = {
        role: "human",
        name: parentAgent.name,
        content: parsed.message,
      };
      const result = await universalInfer({
        model: agent.primaryModel,
        messages: [systemMessage, newMessage],
        tools: tools.length > 0 ? tools : undefined,
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
