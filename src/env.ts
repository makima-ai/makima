import { z } from "zod";

// Define the expected environment variables using Zod
const envSchema = z.object({});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error("❌ Invalid environment variables:", parsedEnv.error.format());
  process.exit(1); // Exit the process if the environment variables are invalid
}

// Export the validated environment variables
export const env = parsedEnv.data;
