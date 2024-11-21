import { knowledgeBaseTool } from ".";
import { getAgentByName, getAgentTools } from "../../db/agent";
import { universalInfer } from "../inference";
import type { UserMessage, OutputMessage, Message } from "../inference/types";
import { createToolFromDb, type DbTool } from "./tool";

export async function agentInfer({
  agentName,
  newMessage,
}: {
  agentName: string;
  newMessage: UserMessage;
}): Promise<OutputMessage> {
  console.time("agentInfer");

  const agent = await getAgentByName(agentName);

  if (!agent) {
    throw new Error(`Agent "${agentName}" not found`);
  }

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
    messages: newMessages,
    tools: tools.length > 0 ? tools : undefined,
    onMessage,
  });

  console.timeEnd("agentInfer");

  return result;
}
