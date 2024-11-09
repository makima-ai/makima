import { z } from "zod";
import { infer } from "./lib/inference";
import { Tool } from "./lib/inference/tool";

const res = await infer({
  model: "openai/gpt-4o-mini",
  messages: [
    {
      role: "human",
      name: "raj",
      content:
        "This is a test to check your tools calling ability, call the tool u hv twice, and also give some indicator to the user like 'im calling the tool now'",
    },
  ],
  tools: [
    new Tool({
      name: "sentiment-analysis",
      params: z.object({
        text: z.string(),
      }),
      function: async (params) => {
        console.log(params.text);
        return "positive";
      },
    }),
  ],
});

console.log(res);
