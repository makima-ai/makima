import { z } from "zod";

// Define the expected environment variables using Zod
const envSchema = z.object({
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_BASE_URL: z.string().url().optional(),
  OLLAMA_HOST: z.string().url().default("http://127.0.0.1:11434"),
  DATABASE_URL: z.string().url(),
  PORT: z.string().default("7777"),
  BETTER_AUTH_SECRET: z.string(),
  BETTER_AUTH_URL: z.string().url(),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1); // Exit the process if the environment variables are invalid
}

// Export the validated environment variables
export const env = parsedEnv.data;
