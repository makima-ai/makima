export type UserMessage = {
  role: "human";
  name: string;
  content: string;
  attachments?: Attachment[];
};

export type Attachment = {
  type: string;
  data: string | Buffer;
};

export type AiMessage = {
  role: "ai";
  name: string;
  content: string;
};

export type ToolCall = {
  role: "tool_call";
  tool_name: string;
  content?: string;
  name?: string;
  params: object;
  id?: string;
};

export type ToolResponse = {
  id: string;
  role: "tool_response";
  name: string;
  content: string;
};

export type Message = UserMessage | AiMessage | ToolCall | ToolResponse;

export type OutputMessage = AiMessage | ToolCall;

export interface ModelAdapter {
  ask(params: {
    model: string;
    message: Message;
    agent_name?: string;
  }): Promise<OutputMessage>;
  infer(params: {
    model: string;
    messages: Message[];
    agent_name?: string;
  }): Promise<OutputMessage>;
}
