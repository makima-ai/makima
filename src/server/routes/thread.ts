import { Elysia, t } from "elysia";
import {
  getThreadDetailsById,
  getMessagesByThreadId,
  createThread,
  addMessageToThread,
  deleteThread,
  updateThreadAgent,
  listAllThreads,
} from "../../db/thread";
import type { UserMessage } from "../../lib/inference/types";
import { threadInfer } from "../../lib/thread";

export const threadRoute = new Elysia({ prefix: "/thread" })
  .get("/", async () => {
    const threads = await listAllThreads();
    return threads;
  })
  // Get thread details by ID
  .get(
    "/:id",
    async ({ params: { id }, error }) => {
      const threadDetails = await getThreadDetailsById(id);
      if (!threadDetails) {
        return error(404, "Thread not found");
      }
      return threadDetails;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  // Get messages of a thread by ID
  .get(
    "/:id/messages",
    async ({ params: { id } }) => {
      const messages = await getMessagesByThreadId(id);
      return messages;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  // Create a new thread
  .post(
    "/create",
    async ({ body }) => {
      const { platform, description, authors, id, agentName } = body;
      const newThread = await createThread({
        id,
        platform,
        description,
        authors,
        agentName,
      });
      return newThread;
    },
    {
      body: t.Object({
        id: t.String(),
        platform: t.String(),
        description: t.Optional(t.String()),
        authors: t.Optional(t.Array(t.String())),
        agentName: t.String(),
      }),
    },
  )
  // Add a message to a thread
  .post(
    "/:id/message",
    async ({ params: { id }, body }) => {
      const { role, content, authorId } = body;
      if (!role || !content || !authorId) {
        return { error: "Invalid input data" };
      }
      const addedMessage = await addMessageToThread(id, {
        role,
        content,
        name: authorId,
      });
      return addedMessage;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        callId: t.Optional(t.String()),
        role: t.Union([t.Literal("human")]),
        name: t.String(),
        content: t.String(),
        authorId: t.String(),
      }),
    },
  )
  // Thread inference (chat)
  .post(
    "/:id/chat",
    async ({ params: { id }, body }) => {
      const { agentName, message } = body;
      const result = await threadInfer({
        threadId: id,
        agentName,
        newMessage: message as UserMessage,
      });
      return result;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        agentName: t.Optional(t.String()),
        message: t.Object({
          role: t.Literal("human"),
          name: t.String(),
          content: t.Union([
            t.String(),
            t.Array(
              t.Object({
                url: t.String(),
                type: t.Union([t.Literal("image"), t.Literal("audio")]),
                detail: t.Optional(
                  t.Union([
                    t.Literal("auto"),
                    t.Literal("low"),
                    t.Literal("high"),
                  ]),
                ),
                format: t.Optional(
                  t.Union([t.Literal("wav"), t.Literal("mp3")]),
                ),
              }),
            ),
          ]),
          attachments: t.Optional(
            t.Array(
              t.Object({
                type: t.String(),
                data: t.Union([t.String(), t.Any()]),
              }),
            ),
          ),
        }),
      }),
    },
  )
  // Delete a thread
  .delete(
    "/:id",
    async ({ params: { id }, error }) => {
      const result = await deleteThread(id);
      if (!result.success) {
        return error(404, "Thread not found");
      }
      return {
        message: "Thread deleted",
        deletedMessages: result.deletedMessages,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  // Update thread's default agent
  .put(
    "/:id/agent",
    async ({ params: { id }, body, error }) => {
      const { agentName } = body;
      const updatedThread = await updateThreadAgent(id, agentName);
      if (!updatedThread) {
        return error(404, "Thread not found or agent could not be updated");
      }
      return updatedThread;
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        agentName: t.String(),
      }),
    },
  );
