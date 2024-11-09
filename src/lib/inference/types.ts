import type { ZodSchema, infer as InferZod } from "zod";

export type MessageContent = string | (ImageContent | AudioContent)[];

type ImageContent = {
  /**
   * Either a URL of the image or the base64 encoded image data.
   */
  url: string;
  type: "image";
  detail?: "auto" | "low" | "high";
};

type AudioContent = {
  /**
   * Base64 encoded audio data.
   */
  url: string;
  type: "audio";
  format: "wav" | "mp3";
};

export type UserMessage = {
  role: "human";
  name: string;
  content: MessageContent;
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

export type ToolCalls = {
  role: "tool_calls";
  content?: string;
  calls: {
    tool_name: string;
    params: object;
    id: string;
  }[];
};

export type ToolResponse = {
  id: string;
  role: "tool_response";
  content: string;
};

export type Message = UserMessage | AiMessage | ToolCalls | ToolResponse;

export type OutputMessage = AiMessage | ToolCalls;

export type ToolContext = {
  id: string;
};

type InferParams<T extends ZodSchema = ZodSchema<any>> = T extends ZodSchema
  ? InferZod<T>
  : unknown;

export interface Tool<T extends ZodSchema = ZodSchema<any>> {
  name: string;
  run: (params: InferParams<T>, context: ToolContext) => Promise<ToolResponse>;
  params?: T;
}

export interface ModelAdapter {
  ask(params: {
    model: string;
    message: Message;
    tools?: Tool[];
    agent_name?: string;
    recursive?: boolean;
  }): Promise<OutputMessage>;
  infer(params: {
    model: string;
    messages: Message[];
    tools?: Tool[];
    agent_name?: string;
    recursive?: boolean;
  }): Promise<OutputMessage>;
}
