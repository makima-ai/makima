import { env } from "../../env";
import { OpenAIAdapter } from "./adapters/openai";
import { OllamaAdapter } from "./adapters/ollama";
import type { Message, ModelAdapter, OutputMessage, Tool } from "./types";

function createAdapter(provider: string): ModelAdapter {
  switch (provider.toLowerCase()) {
    case "openai":
      const openAIConfig: ConstructorParameters<typeof OpenAIAdapter>[0] = {
        apiKey: env.OPENAI_API_KEY,
        baseURL: env.OPENAI_BASE_URL,
      };
      return new OpenAIAdapter(openAIConfig);
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

export async function generateWithImage({
  model,
  prompt,
  imagePath,
}: {
  model: string;
  prompt: string;
  imagePath: string;
}): Promise<string> {
  const [provider, modelName] = model.split("/");

  if (provider.toLowerCase() !== "ollama") {
    throw new Error("Image generation is only supported with Ollama models");
  }

  const adapter = createAdapter(provider) as OllamaAdapter;

  try {
    return await adapter.generateWithImage({
      model: modelName,
      prompt,
      imagePath,
    });
  } catch (error) {
    console.error("Error during image generation:", error);
    throw new Error("Failed to generate with image");
  }
}
