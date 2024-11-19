import { env } from "../../env";
import { OpenAIAdapter } from "./adapters/openai";
import { OllamaAdapter } from "./adapters/ollama";
import type {
  Message,
  Document,
  ModelAdapter,
  OutputMessage,
  Tool,
  Embedding,
} from "./types";

function createAdapter(provider: string): ModelAdapter {
  switch (provider.toLowerCase()) {
    case "openai":
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
  onMessage,
}: {
  model: string;
  messages: Message[];
  tools?: Tool[];
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
