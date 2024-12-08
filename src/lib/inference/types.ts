import type { ZodSchema, infer as InferZod } from "zod";
import type {
  agentsTable,
  contextsTable,
  messagesTable,
} from "../../db/schema";
import type { Embedding, Document, KnowledgeBase } from "../knowledge/types";
import type { JsonSchema7Type } from "zod-to-json-schema";
import type { DbTool } from "../tools";

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

export type BaseMessage = {
  db_id?: string;
  context_id?: string;
};

export type UserMessage = BaseMessage & {
  role: "human";
  name: string;
  content: MessageContent;
  attachments?: Attachment[];
};

export type Attachment = {
  type: string;
  data: string | Buffer;
};

export type AiMessage = BaseMessage & {
  role: "ai";
  name: string;
  content: string;
};

export type SystemMessage = BaseMessage & {
  role: "system";
  content: string;
};

export type ToolCalls = BaseMessage & {
  role: "tool_calls";
  content?: string;
  calls: {
    tool_name: string;
    params: object;
    id: string;
  }[];
};

export type ToolResponse = BaseMessage & {
  id: string;
  role: "tool_response";
  content: string;
};

export type Message =
  | UserMessage
  | AiMessage
  | ToolCalls
  | ToolResponse
  | SystemMessage;

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
  scaling_algorithm?: "window" | "threshold" | "block";
  scaling_config?: ScalingConfig;
};

export type ScalingConfig =
  | WindowScalingConfig
  | ThresholdScalingConfig
  | BlockScalingConfig;

export type WindowScalingConfig = {
  type: "window";
  windowSize: number;
};

export type ThresholdScalingConfig = {
  type: "threshold";
  totalWindow: number;
  summarizationThreshold: number;
};

export type BlockScalingConfig = {
  type: "block";
  blockSize: number;
  maxBlocks?: number;
  blockSummarizationThreshold?: number;
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

export interface Tool {
  name: string;
  description: string;
  run: (params: object, context: ToolContext) => Promise<ToolResponse>;
  params?: JsonSchema7Type;
}

export type ToolProps = {
  name?: string;
  params: JsonSchema7Type;
  description: string;
  function: (params: unknown) => Promise<string>;
  parse?: (params: string) => object | string;
  errorParser?: (error: unknown) => string;
};

type DbAgent = typeof agentsTable.$inferSelect;

export type Agent = {
  name: string;
  description?: string | null;
  prompt: string;
  primaryModel: string;
  fallbackModels?: string[] | null;
  id: string;
  format?: string | null;
  tools?: DbTool[] | null;
  knowledgeBases?: KnowledgeBase[] | null;
  helperAgents?: DbAgent[] | null;
  usedByAgents?: DbAgent[] | null;
};

export interface ModelAdapter {
  ask(params: {
    model: string;
    message: Message;
    format?: string;
    tools?: Tool[];
    agent_name?: string;
    recursive?: boolean;
    signal?: AbortSignal;
  }): Promise<OutputMessage>;
  infer(params: {
    model: string;
    messages: Message[];
    format?: string;
    tools?: Tool[];
    agent_name?: string;
    recursive?: boolean;
    signal?: AbortSignal;
    onMessage?: (message: Message) => void;
  }): Promise<OutputMessage>;
  embed(params: { documents: Document[]; model: string }): Promise<Embedding[]>;
  models(): Promise<string[]>;
}
