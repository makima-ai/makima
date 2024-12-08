import { createPinoLogger } from "@bogeychan/elysia-logger";

// i love golang
export async function handle<T>(
  promise: Promise<T>,
): Promise<[T | null, Error | null]> {
  try {
    const result = await promise;
    return [result, null];
  } catch (error) {
    return [null, error as Error];
  }
}

export const log = createPinoLogger();
