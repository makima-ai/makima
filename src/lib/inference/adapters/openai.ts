import OpenAI, { type ClientOptions } from "openai";
import type {
  Message,
  MessageContent,
  ModelAdapter,
  OutputMessage,
  Tool,
  ToolResponse,
} from "../types";
import type {
  ChatCompletionContentPart,
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/index.mjs";
import type { JSONSchema } from "openai/lib/jsonschema.mjs";
import type { Embedding, Document } from "../../knowledge/types";

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
    signal,
  }: {
    model: string;
    message: Message;
    agent_name?: string;
    tools?: Tool[];
    signal?: AbortSignal;
  }) {
    const omessage: ChatCompletionMessageParam =
      convertMessageToChatCompletionMessageParam(message);

    const res = await this.openai.chat.completions.create(
      {
        model: model,
        messages: [omessage],
        tools: tools?.map(convertToolToChatCompletionTool),
      },
      {
        signal,
      },
    );

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
    recursive = true,
    signal,
    format,
    onMessage,
  }: {
    model: string;
    messages: Message[];
    format?: string;
    agent_name?: string;
    tools?: Tool[];
    recursive?: boolean;
    signal?: AbortSignal;
    onMessage?: (message: Message) => void;
  }): Promise<OutputMessage> {
    const omessages: ChatCompletionMessageParam[] = messages.map(
      convertMessageToChatCompletionMessageParam,
    );

    const otools = tools?.map(convertToolToChatCompletionTool);

    const res = await this.openai.chat.completions.create(
      {
        model: model,
        messages: omessages,
        tools: otools,
        response_format:
          format === "json"
            ? {
                type: "json_object",
              }
            : undefined,
      },
      { signal },
    );

    const inter_message = convertChatCompletionMessageParamToMessage(
      res.choices[0].message,
      agent_name,
    ) as OutputMessage;

    onMessage?.(inter_message);

    if (inter_message.role === "tool_calls") {
      const tool_responses_promises = inter_message.calls.map(async (call) => {
        const tool = tools?.find((t) => t.name === call.tool_name);
        if (!tool) {
          return {
            id: call.id,
            role: "tool_response",
            content: `Tool not found: ${call.tool_name}`,
          };
        }

        const response = await tool.run(call.params, { id: call.id });

        return response;
      });

      const tools_responses = (
        await Promise.allSettled(tool_responses_promises)
      )
        .map((res) => {
          if (res.status === "fulfilled") {
            onMessage?.(res.value as ToolResponse);
            return res.value;
          }

          console.error("Error during tool execution:", res.reason);
        })
        .filter((res) => res);

      if (!recursive) {
        return inter_message;
      }

      return await this.infer({
        model,
        messages: [
          ...messages,
          inter_message,
          ...(tools_responses as ToolResponse[]),
        ],
        agent_name,
        tools,
        onMessage,
        signal,
      });
    }

    return inter_message;
  }
  async embed(params: {
    documents: Document[];
    model: string;
  }): Promise<Embedding[]> {
    const oembeddings = await this.openai.embeddings.create({
      model: params.model,
      input: params.documents.map((doc) => doc.content),
    });

    const embeddings = oembeddings.data.map((embedding) => {
      return {
        model: params.model,
        embeddings: [embedding.embedding],
      };
    });
    return embeddings;
  }
}

export function convertToolToChatCompletionTool(
  tool: Tool,
): ChatCompletionTool {
  const params = tool.params as JSONSchema;
  return {
    function: {
      name: tool.name,
      description: tool.description,
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
    case "system":
      return {
        role: "system",
        content: message.content,
      };
    case "human":
      return {
        role: "user",
        name: message.name,
        content:
          convertMessageContentToChatCompletionContentPart(message.content) ??
          "",
      };
    case "ai":
      return {
        role: "assistant",
        name: message.name,
        content: message.content,
      };
    case "tool_calls":
      return {
        role: "assistant",
        content: message.content || null,
        tool_calls: message.calls.map((call) => {
          return {
            id: call.id,
            function: {
              name: call.tool_name,
              arguments: JSON.stringify(call.params),
            },
            type: "function",
          };
        }),
      };
    case "tool_response":
      return {
        role: "tool",
        content: message.content,
        tool_call_id: message.id,
      };
  }
}

function convertMessageContentToChatCompletionContentPart(
  content: MessageContent,
): ChatCompletionContentPart[] | string | null {
  if (typeof content === "string") {
    return content;
  }

  if (Array.isArray(content)) {
    return content.map((part) => {
      if (part.type === "image") {
        return {
          type: "image_url",
          image_url: {
            url: part.url,
            detail: part.detail,
          },
        };
      }

      return {
        type: "input_audio",
        input_audio: {
          data: part.url,
          format: part.format,
        },
      };
    });
  }
  return null;
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
        const toolCalls = param.tool_calls.map((toolCall) => {
          return {
            id: toolCall.id,
            tool_name: toolCall.function.name,
            params: JSON.parse(toolCall.function.arguments),
          };
        });

        return {
          role: "tool_calls",
          content: param.content?.toString() || undefined,
          calls: toolCalls,
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
        content: param.content.toString(),
      };
    default:
      throw new Error(`Unsupported role: ${param.role}`);
  }
}
