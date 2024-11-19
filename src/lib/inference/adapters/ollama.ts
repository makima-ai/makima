import { Ollama } from "ollama";
import type {
  Message as OllamaMessage,
  ToolCall as OllamaToolCall,
  Tool as OllamaTool,
  ChatRequest,
  ChatResponse,
  GenerateRequest,
} from "ollama";
import type {
  Embedding,
  Document,
  Message,
  ModelAdapter,
  OutputMessage,
  Tool,
} from "../types";

export class OllamaAdapter implements ModelAdapter {
  private ollama: Ollama;

  constructor(options: { host?: string }) {
    this.ollama = new Ollama({
      host: options.host || "http://127.0.0.1:11434",
    });
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
  }): Promise<OutputMessage> {
    const ollamaMessage = this.convertMessageToOllamaFormat(message);
    const chatRequest: ChatRequest & { stream?: false } = {
      model,
      messages: [ollamaMessage],
      stream: false,
      tools: tools ? this.convertToolsToOllamaFormat(tools) : undefined,
    };

    if (signal) {
      signal.onabort = () => {
        this.ollama.abort();
      };
    }

    const response = await this.ollama.chat(chatRequest);

    return this.convertOllamaResponseToMessage(response, agent_name);
  }

  async infer({
    messages,
    model,
    agent_name,
    tools,
    recursive = true,
    signal,
    onMessage,
  }: {
    model: string;
    messages: Message[];
    agent_name?: string;
    tools?: Tool[];
    recursive?: boolean;
    signal?: AbortSignal;
    onMessage?: (message: Message) => void;
  }): Promise<OutputMessage> {
    const ollamaMessages = messages.map(this.convertMessageToOllamaFormat);
    const chatRequest: ChatRequest & { stream?: false } = {
      model,
      messages: ollamaMessages,
      stream: false,
      tools: tools ? this.convertToolsToOllamaFormat(tools) : undefined,
    };

    if (signal) {
      signal.onabort = () => {
        this.ollama.abort();
      };
    }

    const response = await this.ollama.chat(chatRequest);
    const outputMessage = this.convertOllamaResponseToMessage(
      response,
      agent_name,
    );
    onMessage?.(outputMessage);

    if (outputMessage.role === "tool_calls" && tools && tools.length > 0) {
      const toolResponses = await Promise.all(
        outputMessage.calls.map(async (call) => {
          const tool = tools.find((t) => t.name === call.tool_name);
          if (!tool) {
            return {
              id: call.id,
              role: "tool_response" as const,
              content: `Tool not found: ${call.tool_name}`,
            };
          }
          return await tool.run(call.params, { id: call.id });
        }),
      );

      toolResponses.forEach((response) => onMessage?.(response));

      if (recursive) {
        return this.infer({
          model,
          messages: [...messages, outputMessage, ...toolResponses],
          agent_name,
          tools,
          onMessage,
        });
      }
    }

    return outputMessage;
  }

  async embed(params: {
    documents: Document[];
    model: string;
  }): Promise<Embedding[]> {
    const oembeddings = await this.ollama.embed({
      model: params.model,
      input: params.documents.map((doc) => doc.content),
    });

    const embeddings = oembeddings.embeddings.map((oembedding) => ({
      model: params.model,
      embeddings: [oembedding],
    }));

    return embeddings;
  }

  private convertMessageToOllamaFormat(message: Message): OllamaMessage {
    switch (message.role) {
      case "human":
        return {
          role: "user",
          content: message.content as string,
          images: Array.isArray(message.content)
            ? message.content
                .filter((c) => c.type === "image")
                .map((c) => c.url)
            : undefined,
        };
      case "ai":
        return { role: "assistant", content: message.content };
      case "tool_calls":
        return {
          role: "assistant",
          content: message.content || "",
          tool_calls: message.calls.map(
            (call): OllamaToolCall => ({
              function: {
                name: call.tool_name,
                arguments: call.params,
              },
            }),
          ),
        };
      case "tool_response":
        return { role: "tool", content: message.content };
      default:
        throw new Error(
          `Unsupported message role: ${(message as Message).role}`,
        );
    }
  }

  private convertOllamaResponseToMessage(
    response: ChatResponse,
    agent_name?: string,
  ): OutputMessage {
    if (response.message.tool_calls && response.message.tool_calls.length > 0) {
      return {
        role: "tool_calls",
        content: response.message.content,
        calls: response.message.tool_calls.map((call) => ({
          id: Math.random().toString(36).slice(2, 11), // Generate a random ID
          tool_name: call.function.name,
          params: call.function.arguments,
        })),
      };
    }
    return {
      role: "ai",
      name: agent_name || "assistant",
      content: response.message.content,
    };
  }

  private convertToolsToOllamaFormat(tools: Tool[]): OllamaTool[] {
    return tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.params?.description || "",
        parameters: {
          type: "object",
          required: tool.params ? Object.keys(tool.params) : [],
          properties: tool.params || {},
        },
      },
    }));
  }

  async generateWithImage({
    model,
    prompt,
    imagePath,
  }: {
    model: string;
    prompt: string;
    imagePath: string;
  }): Promise<string> {
    const generateRequest: GenerateRequest & { stream?: false } = {
      model,
      prompt,
      images: [imagePath],
      stream: false,
    };

    const response = await this.ollama.generate(generateRequest);
    return response.response;
  }
}
