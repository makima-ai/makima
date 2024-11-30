import { Elysia } from "elysia";
import { threadRoute } from "./routes/thread";
import { agentRoute, toolRoute } from "./routes/agent";
import { env } from "../env";
import serverTiming from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";
import { knowledgeRoute } from "./routes/knowledge";
import { logger } from "@bogeychan/elysia-logger";

const app = new Elysia();

app.use(serverTiming());
app.use(
  logger({
    level: "error",
    autoLogging: true,
  }),
);
app.get(
  "/",
  () => {
    return "Makima is alive";
  },
  {
    detail: {
      summary: "Health check",
      description: "Check if the server is alive",
      tags: ["Service"],
    },
  },
);

app.use(
  swagger({
    autoDarkMode: true,
    path: "/docs",
    scalarConfig: {
      customCss: `body {background:var(--scalar-background-2);}`,
    },

    documentation: {
      servers: [
        {
          url: env.SWAGGER_SERVER_URL,
        },
      ],
      info: {
        title: "Makima",
        version: `1.0.0-alpha.1`,
        contact: {
          name: "makima",
          email: "makima@raj.how",
        },
      },
      tags: [
        {
          name: "Knowledge Base",
          description: "APIs for managing Knowledge bases",
        },
        {
          name: "Agents",
          description: "APIs for managing agents",
        },
        {
          name: "Threads",
          description: "APIs for managing threads",
        },
        {
          name: "Tools",
          description: "APIs for managing tools",
        },
        {
          name: "Service",
          description: "Service health check and stats",
        },
      ],
    },
  }),
);

app.use(threadRoute);
app.use(agentRoute);
app.use(toolRoute);
app.use(knowledgeRoute);

const port = env.PORT;

export function startServer() {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
