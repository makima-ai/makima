import OpenAI, { type ClientOptions } from "openai";
import type { Message, ModelAdapter, OutputMessage } from "../types";
import type { ChatCompletionMessageParam } from "openai/resources/index.mjs";

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
  }: {
    model: string;
    message: Message;
    agent_name?: string;
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
  }: {
    model: string;
    messages: Message[];
    agent_name?: string;
  }): Promise<OutputMessage> {
    const omessages: ChatCompletionMessageParam[] = messages.map(
      convertMessageToChatCompletionMessageParam,
    );

    const res = await this.openai.chat.completions.create({
      model: model,
      messages: omessages,
    });

    return convertChatCompletionMessageParamToMessage(
      res.choices[0].message,
      agent_name,
    ) as OutputMessage;
  }
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
