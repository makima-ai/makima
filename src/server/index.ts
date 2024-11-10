import { Elysia } from "elysia";
import { threadRoute } from "./routes/thread";
import { agentRoute, toolRoute } from "./routes/agent";

const app = new Elysia();

app.use(threadRoute);
app.use(agentRoute);
app.use(toolRoute);

const port = process.env.PORT || 7777;

export function startServer() {
  app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}
