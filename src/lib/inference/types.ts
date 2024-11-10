import type { ZodSchema, infer as InferZod } from "zod";
import type { contextsTable, messagesTable } from "../../db/schema";

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

export type Context = {
  id: string;
  platform: string | null;
  description: string | null;
  authors: string[];
  default_agent_id: string | null;
  default_agent?: {
    id: string;
    name: string;
  } | null;
};

export type DbMessage = typeof messagesTable.$inferSelect;
export type DbMessageInsert = typeof messagesTable.$inferInsert;

export type DbContext = typeof contextsTable.$inferSelect;
export type DbContextInsert = typeof contextsTable.$inferInsert;

export type ToolContext = {
  id: string;
};

export type InferParams<T extends ZodSchema = ZodSchema<any>> =
  T extends ZodSchema ? InferZod<T> : unknown;

export interface Tool<T extends ZodSchema = ZodSchema<any>> {
  name: string;
  run: (params: InferParams<T>, context: ToolContext) => Promise<ToolResponse>;
  params?: T;
}

export type ToolProps<T extends ZodSchema> = {
  name?: string;
  params: T;
  function: (params: InferParams<T>) => Promise<unknown>;
  parse?: (params: string) => object | string;
  errorParser?: (error: unknown) => string;
};

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
    onMessage?: (message: Message) => void;
  }): Promise<OutputMessage>;
}
