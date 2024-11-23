import type {
  ToolContext,
  Tool as ToolInterface,
  ToolProps,
  ToolResponse,
} from "../types";

export class Tool implements ToolInterface {
  public name: string;
  public params: ToolProps["params"];
  public description: ToolProps["description"];
  private function: ToolProps["function"];
  private parse: ToolProps["parse"];

  private errorParser: ToolProps["errorParser"];

  constructor(options: ToolProps) {
    this.name = options.name || options.function.name;
    this.params = options.params;
    this.description = options.description;
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

      let result = await this.function(params);

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
${message}

plz inform user about this immediately.
`;
        console.error("Error parsing tool parameters:", message);
      }

      return {
        id,
        role: "tool_response",
        content: message,
      };
    }
  }
}
