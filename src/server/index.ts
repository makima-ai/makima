import { Elysia } from "elysia";
import { threadRoute } from "./routes/thread";
import { agentRoute, toolRoute } from "./routes/agent";
import { env } from "../env";
import serverTiming from "@elysiajs/server-timing";

const app = new Elysia();

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
