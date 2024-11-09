import OpenAI, { type ClientOptions } from "openai";
import type { Message, ModelAdapter, OutputMessage, Tool } from "../types";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import zodToJsonSchema from "zod-to-json-schema";
import type { JSONSchema } from "openai/lib/jsonschema.mjs";
import { z } from "zod";

export class OpenAIAdapter implements ModelAdapter {
  private openai: OpenAI;
  constructor(options: ClientOptions) {
    this.openai = new OpenAI(options);
    return this;
  }
  async ask({
    model,
    message,
    agent_name,
    tools,
  }: {
    model: string;
    message: Message;
    agent_name?: string;
    tools?: Tool[];
  }) {
    const omessage: ChatCompletionMessageParam =
      convertMessageToChatCompletionMessageParam(message);

    const res = await this.openai.chat.completions.create({
      model: model,
      messages: [omessage],
    });

    return convertChatCompletionMessageParamToMessage(
      res.choices[0].message,
      agent_name,
    ) as OutputMessage;
  }

  async infer({
    messages,
    model,
    agent_name,
    tools,
  }: {
    model: string;
    messages: Message[];
    agent_name?: string;
    tools?: Tool[];
  }): Promise<OutputMessage> {
    const omessages: ChatCompletionMessageParam[] = messages.map(
      convertMessageToChatCompletionMessageParam,
    );

    const otools = tools?.map(convertToolToChatCompletionTool);

    const res = await this.openai.chat.completions.create({
      model: model,
      messages: omessages,
      tools: otools,
    });

    return convertChatCompletionMessageParamToMessage(
      res.choices[0].message,
      agent_name,
    ) as OutputMessage;
  }
}

export function convertToolToChatCompletionTool(
  tool: Tool,
): ChatCompletionTool {
  const params = zodToJsonSchema(tool.params ?? z.object({})) as JSONSchema;
  return {
    function: {
      name: tool.name,
      description: params.description,
      parameters: {
        type: "object",
        properties: params.properties,
      },
    },
    type: "function",
  };
}

export function convertMessageToChatCompletionMessageParam(
  message: Message,
): ChatCompletionMessageParam {
  switch (message.role) {
    case "human":
      return {
        role: "user",
        name: message.name,
        content: message.content,
      };
    case "ai":
      return {
        role: "assistant",
        name: message.name,
        content: message.content,
      };
    case "tool_call":
      return {
        role: "assistant",
        content: message.content || null,
        tool_calls: [
          {
            id: message.id || "",
            type: "function",
            function: {
              name: message.tool_name,
              arguments: JSON.stringify(message.params),
            },
          },
        ],
      };
    case "tool_response":
      return {
        role: "tool",
        content: message.content,
        tool_call_id: message.id,
      };
  }
}

export function convertChatCompletionMessageParamToMessage(
  param: ChatCompletionMessageParam,
  model_name?: string,
): Message {
  switch (param.role) {
    case "user":
      return {
        role: "human",
        name: param.name || "user",
        content:
          typeof param.content === "string"
            ? param.content
            : JSON.stringify(param.content),
      };
    case "assistant":
      if (param.tool_calls && param.tool_calls.length > 0) {
        const toolCall = param.tool_calls[0];
        return {
          role: "tool_call",
          tool_name: toolCall.function.name,
          name: model_name,
          content: param.content?.toString() || undefined,
          params: JSON.parse(toolCall.function.arguments),
          id: toolCall.id,
        };
      } else {
        return {
          role: "ai",
          name: model_name || param.name || "assistant",
          content:
            typeof param.content === "string"
              ? param.content
              : JSON.stringify(param.content),
        };
      }
    case "tool":
      return {
        id: param.tool_call_id,
        role: "tool_response",
        name: model_name || "",
        content: param.content.toString(),
      };
    default:
      throw new Error(`Unsupported role: ${param.role}`);
  }
}
