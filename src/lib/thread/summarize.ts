import { universalInfer } from "../inference";
import type { AiMessage, Message, SystemMessage } from "../inference/types";

export async function generateSummary(
  messages: Message[],
  model: string,
): Promise<AiMessage> {
  const systemPrompt: SystemMessage = {
    role: "system",
    content: `Generate a structured summary of the conversation, organized in the following sections:
    
    1. Key Conversation Points
    - Clearly attribute each point to the respective participant
    - Keep focus on main discussion points and decisions made
    
    2. Tool Interactions & Commands
    - List the significant tools or commands that were used
    - Include the purpose and outcome of each tool interaction
    
    3. Actions Taken
    - Summarize important actions or changes made during the conversation
    
    Keep each section concise and focused on essential information. Maintain clear attribution of who said or did what throughout the summary.`,
  };

  return (await universalInfer({
    messages: [systemPrompt, ...messages],
    model,
  })) as AiMessage;
}
