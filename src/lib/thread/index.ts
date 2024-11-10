import { getAgentById } from "../../db/agent";
import {
  getThreadDetailsById,
  getMessagesByThreadId,
  addMessagesToThread,
} from "../../db/thread";
import { universalInfer } from "../inference";
import type { UserMessage, OutputMessage, Message } from "../inference/types";

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

    // Step 5: Run universalInfer
    const result = await universalInfer({
      model: agent.primaryModel,
      messages: contextMessages,
      // tools: agent.tools,
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
