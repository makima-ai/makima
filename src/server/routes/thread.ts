import { Elysia, t } from "elysia";
import {
  getThreadDetailsById,
  getMessagesByThreadId,
  createThread,
  addMessageToThread,
  deleteThread,
  updateThreadAgent,
  listAllThreads,
  updateThreadScaling,
} from "../../db/thread";
import type { UserMessage } from "../../lib/inference/types";
import { threadInfer } from "../../lib/thread";
import { handle, log } from "../../lib/utils";

export const threadRoute = new Elysia({ prefix: "/thread" })
  .get(
    "/",
    async ({ error }) => {
      const [threads, err] = await handle(listAllThreads());
      if (err) {
        log.error(err.message);
        return error(500, "Error getting threads");
      }
      return threads;
    },
    {
      detail: {
        summary: "Get all threads",
        description: "Get all threads in the system.",
        tags: ["Threads"],
      },
    },
  )
  .get(
    "/:id",
    async ({ params: { id }, error }) => {
      const [threadDetails, err] = await handle(getThreadDetailsById(id));
      if (err) {
        log.error(err.message);
        return error(500, "Error getting thread details");
      }
      if (!threadDetails) {
        return error(404, "Thread not found");
      }
      return threadDetails;
    },
    {
      params: t.Object({
        id: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Get threads by ID",
        description: "Gets the details of a thread by its ID.",
        tags: ["Threads"],
      },
    },
  )
  .get(
    "/:id/messages",
    async ({ params: { id }, error }) => {
      const [messages, err] = await handle(getMessagesByThreadId(id));
      if (err) {
        log.error(err.message);
        return error(500, "Error getting thread messages");
      }
      return messages;
    },
    {
      params: t.Object({
        id: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Get messages by thread ID",
        description: "Gets all messages of a thread by its Thread ID.",
        tags: ["Threads"],
      },
    },
  )
  .post(
    "/create",
    async ({ body, error }) => {
      const [newThread, err] = await handle(
        createThread({
          id: body.id,
          platform: body.platform,
          description: body.description,
          authors: body.authors,
          agentName: body.agentName,
          scalingAlgorithm: body.scalingAlgorithm,
          scalingConfig: body.scalingConfig,
        }),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error creating thread");
      }
      return newThread;
    },
    {
      body: t.Object({
        id: t.String({ minLength: 4, maxLength: 255 }),
        platform: t.String({ minLength: 4, maxLength: 255 }),
        description: t.Optional(t.String({ maxLength: 255 })),
        authors: t.Optional(
          t.Array(t.String({ minLength: 4, maxLength: 255 })),
        ),
        agentName: t.String({ minLength: 4, maxLength: 255 }),
        scalingAlgorithm: t.Optional(
          t.Union([
            t.Literal("window"),
            t.Literal("threshold"),
            t.Literal("block"),
          ]),
        ),
        scalingConfig: t.Optional(
          t.Union([
            t.Object({
              type: t.Literal("window"),
              windowSize: t.Number({ minimum: 1 }),
            }),
            t.Object({
              type: t.Literal("threshold"),
              totalWindow: t.Number({ minimum: 1 }),
              summarizationThreshold: t.Number({ minimum: 1 }),
            }),
            t.Object({
              type: t.Literal("block"),
              blockSize: t.Number({ minimum: 1 }),
              maxBlocks: t.Optional(t.Number({ minimum: 1 })),
              blockSummarizationThreshold: t.Optional(t.Number({ minimum: 1 })),
            }),
          ]),
        ),
      }),
      detail: {
        summary: "Create a new thread",
        description:
          "Creates a new thread with the provided details including scaling configuration.",
        tags: ["Threads"],
      },
    },
  )
  .post(
    "/:id/message",
    async ({ params: { id }, body, error }) => {
      const [addedMessage, err] = await handle(
        addMessageToThread(id, {
          role: "human",
          content: body.content,
          name: body.authorId,
        }),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error adding message to thread");
      }
      return addedMessage;
    },
    {
      params: t.Object({
        id: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        callId: t.Optional(t.String({ minLength: 4, maxLength: 255 })),
        name: t.String({ minLength: 4, maxLength: 255 }),
        content: t.String({ minLength: 1 }),
        authorId: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Add a message to a thread",
        description:
          "Adds a message to a thread with the provided details such as role, content, and author ID.",
        tags: ["Threads"],
      },
    },
  )
  .post(
    "/:id/chat",
    async ({ params: { id }, body, error }) => {
      const [result, err] = await handle(
        threadInfer({
          threadId: id,
          agentName: body.agentName,
          newMessage: body.message as UserMessage,
        }),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error performing thread inference");
      }
      return result;
    },
    {
      params: t.Object({
        id: t.String({ minLength: 3, maxLength: 255 }),
      }),
      body: t.Object({
        agentName: t.Optional(t.String({ minLength: 3, maxLength: 255 })),
        message: t.Object({
          role: t.Literal("human", { default: "human" }),
          name: t.String({ minLength: 3, maxLength: 255 }),
          content: t.Union(
            [
              t.String({ minLength: 1 }),
              t.Array(
                t.Object({
                  url: t.String({ minLength: 1 }),
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
            ],
            {
              default: "",
            },
          ),
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
      detail: {
        summary: "Thread inference (chat)",
        description:
          "Performs inference on a thread with the provided message and agent name.",
        tags: ["Threads"],
      },
    },
  )
  .delete(
    "/:id",
    async ({ params: { id }, error }) => {
      const [result, err] = await handle(deleteThread(id));
      if (err) {
        log.error(err.message);
        return error(500, "Error deleting thread");
      }
      if (!result?.success) {
        return error(404, "Thread not found");
      }
      return {
        message: "Thread deleted",
        deletedMessages: result.deletedMessages,
      };
    },
    {
      params: t.Object({
        id: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Delete a thread",
        description: "Deletes a thread by its ID along with all its messages.",
        tags: ["Threads"],
      },
    },
  )
  .put(
    "/:id/agent",
    async ({ params: { id }, body, error }) => {
      const [updatedThread, err] = await handle(
        updateThreadAgent(id, body.agentName),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error updating thread's agent");
      }
      if (!updatedThread) {
        return error(404, "Thread not found or agent could not be updated");
      }
      return updatedThread;
    },
    {
      params: t.Object({
        id: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        agentName: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Update thread's default agent",
        description: "Updates the default agent of a thread by its ID.",
        tags: ["Threads"],
      },
    },
  )
  .put(
    "/:id/scaling",
    async ({ params: { id }, body, error }) => {
      const [updatedThread, err] = await handle(
        updateThreadScaling(
          id,
          body.scalingAlgorithm || null,
          body.scalingConfig || null,
        ),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error updating thread scaling configuration");
      }
      if (!updatedThread) {
        return error(404, "Thread not found or scaling could not be updated");
      }
      return updatedThread;
    },
    {
      params: t.Object({
        id: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        scalingAlgorithm: t.Optional(
          t.Union([
            t.Literal("window"),
            t.Literal("threshold"),
            t.Literal("block"),
          ]),
        ),
        scalingConfig: t.Optional(
          t.Union([
            t.Object({
              type: t.Literal("window"),
              windowSize: t.Number({ minimum: 1 }),
            }),
            t.Object({
              type: t.Literal("threshold"),
              totalWindow: t.Number({ minimum: 1 }),
              summarizationThreshold: t.Number({ minimum: 1 }),
            }),
            t.Object({
              type: t.Literal("block"),
              blockSize: t.Number({ minimum: 1 }),
              maxBlocks: t.Optional(t.Number({ minimum: 1 })),
              blockSummarizationThreshold: t.Optional(t.Number({ minimum: 1 })),
            }),
          ]),
        ),
      }),
      detail: {
        summary: "Update thread scaling configuration",
        description:
          "Updates the scaling algorithm and configuration for a thread.",
        tags: ["Threads"],
      },
    },
  );
