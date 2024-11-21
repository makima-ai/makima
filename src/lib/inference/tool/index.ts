import type {
  InferParams,
  ToolContext,
  Tool as ToolInterface,
  ToolProps,
  ToolResponse,
} from "../types";
import type { ZodSchema } from "zod";

export class Tool<T extends ZodSchema> implements ToolInterface {
  public name: string;
  public params: ToolProps<T>["params"];
  private function: ToolProps<T>["function"];
  private parse: ToolProps<T>["parse"];

  private errorParser: ToolProps<T>["errorParser"];

  constructor(options: ToolProps<T>) {
    this.name = options.name || options.function.name;
    this.params = options.params;
    this.function = options.function;
    this.parse = options.parse;
    this.errorParser = options.errorParser;
  }

  async run(params: unknown, context: ToolContext): Promise<ToolResponse> {
    const id = context.id;
    let parserError = true;
    try {
      params = this.parse ? this.parse(params as string) : params;
      parserError = false;

      let result = await this.function(params as InferParams<T>);

      if (typeof result !== "string") {
        result = JSON.stringify(result);
      }

      return {
        id,
        role: "tool_response",
        content: String(result),
      };
    } catch (error) {
      let message = this.errorParser ? this.errorParser(error) : String(error);

      if (parserError) {
        message = `There was an error cause by you by providing invalid parameters:
${message}`;
      }

      return {
        id,
        role: "tool_response",
        content: message,
      };
    }
  }
}
