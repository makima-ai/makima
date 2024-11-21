import { z } from "zod";
import { getAgentById, getAgentTools } from "../../db/agent";
import {
  getThreadDetailsById,
  getMessagesByThreadId,
  addMessagesToThread,
} from "../../db/thread";
import { universalInfer } from "../inference";
import { Tool } from "../inference/tool";
import type { UserMessage, OutputMessage, Message } from "../inference/types";
import type { KnowledgeBase } from "../knowledge/types";
import { createToolFromDb, type DbTool } from "./tool";
import { searchKnowledgeBase } from "../knowledge";

export async function threadInfer({
  threadId,
  agentName,
  newMessage,
}: {
  threadId: string;
  agentName?: string;
  newMessage: UserMessage;
}): Promise<OutputMessage> {
  console.time("threadInfer");

  try {
    // Step 1 & 2: Get thread details and validate agent
    const threadDetails = await getThreadDetailsById(threadId);
    if (!threadDetails) {
      throw new Error("Thread not found");
    }

    let agent;
    if (agentName) {
      agent = await getAgentById(agentName);
      if (!agent) {
        throw new Error(`Agent "${agentName}" not found`);
      }
    } else if (threadDetails.default_agent_id) {
      agent = await getAgentById(threadDetails.default_agent_id);
      if (!agent) {
        throw new Error("Default agent not found");
      }
    } else {
      throw new Error(
        "No agent specified and no default agent set for the thread",
      );
    }

    // Step 3 & 4: Prepare messages and set up tracking
    const previousMessages = await getMessagesByThreadId(threadId);
    const contextMessages = [...previousMessages.slice(-9), newMessage].slice(
      -10,
    );
    const newMessages: Message[] = [newMessage];

    const onMessage = (message: Message) => {
      newMessages.push(message);
    };

    const knowledgeBases = agent.knowledgeBases || [];

    const kbtools = knowledgeBases.map(knowledgeBaseTool);

    // Step 5: Run universalInfer

    const dbtools: DbTool[] = await getAgentTools(agent.id);

    const registerd_tools = dbtools.map(createToolFromDb);

    let tools = registerd_tools.concat(kbtools);

    const result = await universalInfer({
      model: agent.primaryModel,
      messages: contextMessages,
      tools: tools.length > 0 ? tools : undefined,
      onMessage,
    });

    // Step 6: Save all new messages to the thread
    await addMessagesToThread(threadId, newMessages);

    console.timeEnd("threadInfer");

    // Step 7: Return the latest message
    return result;
  } catch (error) {
    console.timeEnd("threadInfer");
    console.error("Error in threadInfer:", error);
    throw error;
  }
}

const paramsSchema = z.object({
  query: z.string().describe("Query/Talk to the knowledge base"),
  k: z.number().describe("Top k number of results to return"),
});

function knowledgeBaseTool(kb: KnowledgeBase): Tool<z.ZodObject<any>> {
  const tool = new Tool({
    name: `search-knowledge-base-${kb.name}`,
    params: paramsSchema,
    function: async (params: z.infer<typeof paramsSchema>) => {
      console.log("Searching knowledge base", kb.name, params);
      try {
        const results = await searchKnowledgeBase(
          kb.name,
          params.query,
          params.k,
        );
        return results;
      } catch (error) {
        console.error("Error querying knowledge Base", error);
        throw error;
      }
    },
    parse: (params: string) => {
      try {
        return JSON.parse(params);
      } catch {
        return params;
      }
    },
    errorParser: (error: unknown) =>
      `Error: ${error instanceof Error ? error.message : String(error)}`,
  });
  return tool;
}
