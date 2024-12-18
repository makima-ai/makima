import { getAgentById, getAgentByName, getAgentTools } from "../../db/agent";
import { getThreadDetailsById, addMessagesToThread } from "../../db/thread";
import { universalInfer } from "../inference";
import type {
  UserMessage,
  OutputMessage,
  Message,
  SystemMessage,
} from "../inference/types";
import {
  createToolFromAgent,
  createToolFromDb,
  createToolFromKB,
  type DbTool,
} from "../tools";
import { getScaledMessages } from "./scale";

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
      agent = await getAgentByName(agentName);
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

    const systemMessage: SystemMessage = {
      role: "system",
      content: agent.prompt,
    };

    // Get scaled messages with the agent's model for summarization
    const scaledMessages = await getScaledMessages(threadId, agent);
    const contextMessages = [systemMessage, ...scaledMessages, newMessage];
    const newMessages: Message[] = [newMessage];

    const onMessage = (message: Message) => {
      newMessages.push(message);
    };

    const knowledgeBases = agent.knowledgeBases || [];

    const kbtools = knowledgeBases.map(createToolFromKB);

    const helperAgents = agent.helperAgents || [];

    const atools = helperAgents.map((a) =>
      createToolFromAgent(a, agent, {
        latestMessage: newMessage,
        platform: threadDetails.platform || `thread:${threadId}`,
        authorId: newMessage.authorId,
      }),
    );

    // Step 5: Run universalInfer

    const dbtools: DbTool[] = await getAgentTools(agent.id);

    const registerd_tools = dbtools.map((t) =>
      createToolFromDb(t, {
        latestMessage: newMessage,
        platform: threadDetails.platform || `thread:${threadId}`,
        authorId: newMessage.authorId,
      }),
    );

    let tools = registerd_tools.concat(kbtools);
    tools = tools.concat(atools);

    const result = await universalInfer({
      model: agent.primaryModel,
      messages: contextMessages,
      tools: tools.length > 0 ? tools : undefined,
      onMessage,
      format: agent.format || undefined,
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
