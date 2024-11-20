import { Elysia } from "elysia";
import { threadRoute } from "./routes/thread";
import { agentRoute, toolRoute } from "./routes/agent";
import { env } from "../env";
import serverTiming from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";
import { knowledgeRoute } from "./routes/knowledge";

const app = new Elysia();

app.use(serverTiming());
app.get("/", () => {
  return "Makima is alive";
});

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
        version: `1.0`,
        contact: {
          name: "makima",
          email: "makima@raj.how",
        },
      },
      tags: [
        {
          name: "Threads",
          description: "APIs for managing threads",
        },
        {
          name: "Agents",
          description: "APIs for managing agents",
        },
        {
          name: "Tools",
          description: "APIs for managing tools",
        },
        {
          name: "Knowledge Base",
          description: "APIs for managing Knowledge bases",
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
