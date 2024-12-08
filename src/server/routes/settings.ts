import Elysia, { t } from "elysia";
import { universalModels } from "../../lib/inference";

export const settingsRoutes = new Elysia({ prefix: "/settings" }).get(
  "/models",
  async ({ query }) => {
    const models = await universalModels(query.provider);
    return models;
  },
  {
    query: t.Object({
      provider: t.Optional(t.String()),
    }),
    response: t.Array(t.String()),
    detail: {
      summary: "Get list of all models",
      description: "Get a list of all models available for inference",
      tags: ["Settings"],
    },
  },
);
