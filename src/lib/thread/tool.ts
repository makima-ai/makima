import { z } from "zod";
import type { toolsTable } from "../../db/schema";
import { Tool } from "../inference/tool";

// Infer the type of the database tool from the Drizzle schema
export type DbTool = typeof toolsTable.$inferSelect;

// Function to convert a database tool to a Tool instance
export function createToolFromDb(dbTool: DbTool): Tool<z.ZodObject<any>> {
  // Parse the params from the database
  const paramsSchema = z.object((dbTool.params as any)?.properties || {});

  // Create the Tool instance
  return new Tool({
    name: dbTool.name,
    params: paramsSchema,
    function: async (params: z.infer<typeof paramsSchema>) => {
      try {
        // Prepare the request options
        const options: RequestInit = {
          method: dbTool.method.toUpperCase(),
          headers: {
            "Content-Type": "application/json",
          },
        };

        // Add body for POST, PUT, PATCH methods
        if (["POST", "PUT", "PATCH"].includes(dbTool.method.toUpperCase())) {
          options.body = JSON.stringify(params);
        }

        // For GET requests, append params to URL
        let url = dbTool.endpoint;
        if (
          dbTool.method.toUpperCase() === "GET" &&
          Object.keys(params).length > 0
        ) {
          const searchParams = new URLSearchParams(
            params as Record<string, string>,
          );
          url += `?${searchParams.toString()}`;
        }

        // Make the API call
        const response = await fetch(url, options);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        // Parse the response
        const result = await response.json();
        return result;
      } catch (error) {
        console.error("Error calling tool API:", error);
        throw error;
      }
    },
    parse: (params: string) => {
      const parsed = JSON.parse(params);
      const valid = paramsSchema.parse(parsed);
      return valid;
    },
    errorParser: (error: unknown) =>
      `Error: ${error instanceof Error ? error.message : String(error)}`,
  });
}
