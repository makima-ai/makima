import { z } from "zod";
import { infer } from "./lib/inference";
import { Tool } from "./lib/inference/tool";

const res = await infer({
  model: "openai/gpt-4o-mini",
  messages: [
    {
      role: "human",
      name: "raj",
      content: "Hello, how does that sound",
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
