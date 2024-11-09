import type {
  ToolContext,
  Tool as ToolInterface,
  ToolResponse,
} from "../types";
import type { ZodSchema, infer as InferZod } from "zod";

type InferParams<T extends ZodSchema> = InferZod<T>;

type ToolProps<T extends ZodSchema> = {
  name?: string;
  params: T;
  function: (params: InferParams<T>) => Promise<unknown>;
  parse?: (params: string) => object | string;
  errorParser?: (error: unknown) => string;
};

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
    try {
      params = this.parse ? this.parse(params as string) : params;

      let result = await this.function(params as InferParams<T>);

      return {
        id,
        role: "tool_response",
        content: String(result),
      };
    } catch (error) {
      return {
        id,
        role: "tool_response",
        content: this.errorParser ? this.errorParser(error) : String(error),
      };
    }
  }
}
