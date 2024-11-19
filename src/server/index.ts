import { Elysia } from "elysia";
import { threadRoute } from "./routes/thread";
import { agentRoute, toolRoute } from "./routes/agent";
import { env } from "../env";
import serverTiming from "@elysiajs/server-timing";
import { swagger } from "@elysiajs/swagger";

const app = new Elysia();

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
          url: "http://localhost:7777",
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
      ],
    },
  }),
);

app.use(serverTiming());
app.use(threadRoute);
app.use(agentRoute);
app.use(toolRoute);

const port = env.PORT;

export function startServer() {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
