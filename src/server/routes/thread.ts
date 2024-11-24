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

export const threadRoute = new Elysia({ prefix: "/thread" })
  .get(
    "/",
    async () => {
      const threads = await listAllThreads();
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
        id: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Get threads by ID",
        description: "Gets the details of a thread by its ID.",
        tags: ["Threads"],
      },
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
        id: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Get messages by thread ID",
        description: "Gets all messages of a thread by its Thread ID.",
        tags: ["Threads"],
      },
    },
  )
  // Create a new thread
  .post(
    "/create",
    async ({ body }) => {
      const {
        platform,
        description,
        authors,
        id,
        agentName,
        scalingAlgorithm,
        scalingConfig,
      } = body;
      const newThread = await createThread({
        id,
        platform,
        description,
        authors,
        agentName,
        scalingAlgorithm,
        scalingConfig,
      });
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
  // Add a message to a thread
  .post(
    "/:id/message",
    async ({ params: { id }, body }) => {
      const { content, authorId } = body;
      const role = "human";
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
        id: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        callId: t.Optional(t.String({ minLength: 4, maxLength: 255 })),
        // role: t.Union([t.Literal("human")]),
        name: t.String({ minLength: 4, maxLength: 255 }),
        content: t.String({ minLength: 1 }),
        authorId: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Add a message to a thread",
        description:
          "Adds a message to a thread with the provided details such as role, content, and author ID along with the thread ID on which the message should be added.",
        tags: ["Threads"],
      },
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
          "Performs inference on a thread with the provided message and agent name along with the thread ID on which the inference should be performed.",
        tags: ["Threads"],
      },
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
        id: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Delete a thread",
        description:
          "Deletes a thread by its ID along with all the messages associated with it and returns the deleted messages count.",
        tags: ["Threads"],
      },
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
        id: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        agentName: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Update thread's default agent",
        description:
          "Updates the default agent of a thread by its ID with the provided agent name , can retrun not found or agent could not be updated",
        tags: ["Threads"],
      },
    },
  )
  .put(
    "/:id/scaling",
    async ({ params: { id }, body, error }) => {
      const { scalingAlgorithm, scalingConfig } = body;

      if (scalingAlgorithm && !scalingConfig) {
        return error(
          400,
          "Scaling configuration is required with the algorithm",
        );
      }

      const updatedThread = await updateThreadScaling(
        id,
        scalingAlgorithm || null,
        scalingConfig || null,
      );
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
