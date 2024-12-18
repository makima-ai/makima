import { getAgentByName, getAgentTools } from "../../db/agent";
import { universalInfer } from "../inference";
import type {
  UserMessage,
  OutputMessage,
  Message,
  SystemMessage,
} from "../inference/types";
import {
  createToolFromKB,
  createToolFromAgent,
  type DbTool,
  createToolFromDb,
} from "../tools";

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

  const agentSystemPrompt: SystemMessage = {
    role: "system",
    content: agent.prompt,
  };

  const newMessages: Message[] = [agentSystemPrompt, newMessage];

  const onMessage = (message: Message) => {
    newMessages.push(message);
  };

  const knowledgeBases = agent.knowledgeBases || [];

  const kbtools = knowledgeBases.map(createToolFromKB);

  const helperAgent = agent.helperAgents;

  const atools =
    helperAgent?.map((a) =>
      createToolFromAgent(a, agent, {
        latestMessage: newMessage,
        platform: `agent:${agent.name}`,
        authorId: newMessage.authorId,
      }),
    ) || [];

  const dbtools: DbTool[] = await getAgentTools(agent.id);

  const registerd_tools = dbtools.map((t) =>
    createToolFromDb(t, {
      latestMessage: newMessage,
      platform: `agent:${agent.name}`,
      authorId: newMessage.authorId,
    }),
  );

  let tools = registerd_tools.concat(kbtools);
  tools = tools.concat(atools);

  const result = await universalInfer({
    model: agent.primaryModel,
    messages: newMessages,
    tools: tools.length > 0 ? tools : undefined,
    onMessage,
    format: agent.format || undefined,
  });

  console.timeEnd("agentInfer");

  return result;
}
