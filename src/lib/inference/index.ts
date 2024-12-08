import { env } from "../../env";
import { OpenAIAdapter } from "./adapters/openai";
import { OllamaAdapter } from "./adapters/ollama";
import type { Message, ModelAdapter, OutputMessage, Tool } from "./types";
import type { Embedding, Document } from "../knowledge/types";

export const inference_providers = ["openai", "ollama"];

function createAdapter(provider: string): ModelAdapter {
  switch (provider.toLowerCase()) {
    case "openai":
      if (!env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is required");
      }
      const openAIConfig: ConstructorParameters<typeof OpenAIAdapter>[0] = {
        apiKey: env.OPENAI_API_KEY,
        baseURL: env.OPENAI_BASE_URL,
      };
      return new OpenAIAdapter(openAIConfig);
    // This is just a test adapter, using the ollama beta compatibility layer for openai sdk
    case "ollama-openai":
      const ollamaOpenaiConfig: ConstructorParameters<typeof OpenAIAdapter>[0] =
      {
        apiKey: "",
        baseURL: `${env.OLLAMA_HOST}/v1`,
      };
      return new OpenAIAdapter(ollamaOpenaiConfig);
    case "ollama":
      const ollamaConfig: ConstructorParameters<typeof OllamaAdapter>[0] = {
        host: env.OLLAMA_HOST,
      };
      return new OllamaAdapter(ollamaConfig);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function universalInfer({
  model,
  messages,
  tools,
  format,
  onMessage,
}: {
  model: string;
  messages: Message[];
  tools?: Tool[];
  format?: string;
  onMessage?: (message: Message) => void;
}): Promise<OutputMessage> {
  const modelParts = model.split("/");

  if (modelParts.length !== 2) {
    throw new Error("Invalid model name");
  }

  const [provider, modelName] = modelParts;

  const adapter = createAdapter(provider);

  try {
    const result = await adapter.infer({
      model: modelName,
      messages,
      tools,
      onMessage,
      format,
    });
    return result;
  } catch (error) {
    console.error("Error during inference:", error);
    throw new Error("Failed to perform inference");
  }
}

export async function universalEmbed({
  model,
  documents,
}: {
  model: string;
  documents: Document[];
}): Promise<Embedding[]> {
  const modelParts = model.split("/");

  if (modelParts.length !== 2) {
    throw new Error("Invalid model name");
  }

  const [provider, modelName] = modelParts;

  const adapter = createAdapter(provider);

  try {
    const result = await adapter.embed({
      model: modelName,
      documents,
    });
    return result;
  } catch (error) {
    console.error("Error during embedding:", error);
    throw new Error("Failed to perform embedding");
  }
}

export async function universalModels(provider?: string): Promise<string[]> {
  try {
    if (provider) {
      const adapter = createAdapter(provider);
      const models = await adapter.models();
      return models.map((model) => `${provider}/${model}`);
    }

    const allModels: string[] = [];

    for (const provider of inference_providers) {
      try {
        const adapter = createAdapter(provider);
        const models = await adapter.models();
        allModels.push(...models.map((model) => `${provider}/${model}`));
      } catch (error) {
        console.error(`Error fetching models for ${provider}:`, error);
      }
    }

    return allModels;
  } catch (error) {
    console.error("Error during models fetching:", error);
    throw new Error("Failed to fetch models");
  }
}
