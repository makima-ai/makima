import { OpenAIAdapter } from "./adapters/openai";
import type { Message, ModelAdapter, OutputMessage } from "./types";

function createAdapter(provider: string): ModelAdapter {
  switch (provider.toLowerCase()) {
    case "openai":
      const openAIConfig: ConstructorParameters<typeof OpenAIAdapter>[0] = {
        apiKey: process.env.OPENAI_API_KEY,
        baseURL: process.env.OPENAI_BASE_URL,
        timeout: parseInt(process.env.OPENAI_TIMEOUT || "30000"),
        maxRetries: parseInt(process.env.OPENAI_MAX_RETRIES || "3"),
        organization: process.env.OPENAI_ORGANIZATION,
      };

      return new OpenAIAdapter(openAIConfig);
    // Add cases for other providers here when they are implemented
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

export async function infer(
  model: string,
  messages: Message[],
): Promise<OutputMessage> {
  const [provider, modelName] = model.split("/");

  const adapter = createAdapter(provider);

  try {
    const result = await adapter.infer({
      model: modelName,
      messages,
    });
    return result;
  } catch (error) {
    console.error("Error during inference:", error);
    throw new Error("Failed to perform inference");
  }
}
