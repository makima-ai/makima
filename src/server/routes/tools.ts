import Elysia, { error, t } from "elysia";
import {
  listAllTools,
  getToolByName,
  createTool,
  updateTool,
  deleteTool,
} from "../../db/agent";
import { handle, log } from "../../lib/utils";

export const toolRoute = new Elysia({ prefix: "/tool" })
  .get(
    "/",
    async ({ query }) => {
      const [tools, err] = await handle(
        listAllTools({
          tag: query.tag,
        }),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error getting tools");
      }
      return tools;
    },
    {
      query: t.Object({
        tag: t.Optional(t.String({ minLength: 1 })),
      }),
      detail: {
        summary: "Get all tools",
        description:
          "Get all tools in the system and their details such as name, description, endpoint, method, and parameters.",
        tags: ["Tool"],
      },
    },
  )
  // Get tool by name
  .get(
    "/:name",
    async ({ params: { name }, error }) => {
      const [tool, err] = await handle(getToolByName(name));
      if (err) {
        log.error(err.message);
        return error(500, "Error getting tool");
      }
      if (!tool) {
        return error(404, "Tool not found");
      }
      return tool;
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Get tool by name",
        description:
          "Gets the details of a tool by its name. This response includes the tool details such as name, description, endpoint, method, and parameters.",
        tags: ["Tool"],
      },
    },
  )

  // Create a new tool
  .post(
    "/create",
    async ({ body, error }) => {
      const [newTool, err] = await handle(createTool(body));
      if (err) {
        log.error(err.message);
        return error(500, "Error creating tool");
      }
      return newTool;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
        description: t.Optional(t.String({ maxLength: 255 })),
        params: t.Optional(t.Any()),
        endpoint: t.String({ minLength: 4 }),
        method: t.String({ minLength: 1 }),
      }),
      detail: {
        summary: "Create a new tool",
        description:
          "Creates a new tool with the provided details. The tool details include the tool name, description, parameters, endpoint, and method. These details are required to create a new tool.",
        tags: ["Tool"],
      },
    },
  )

  // Update a tool
  .put(
    "/:name",
    async ({ params: { name }, body, error }) => {
      const [updatedTool, err] = await handle(updateTool(name, body));
      if (err) {
        log.error(err.message);
        return error(500, "Error updating tool");
      }
      if (!updatedTool) {
        return error(404, "Tool not found");
      }
      return updatedTool;
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 4, maxLength: 255 })),
        description: t.Optional(t.String({ maxLength: 255 })),
        params: t.Optional(t.Any()),
        endpoint: t.Optional(t.String({ minLength: 4 })),
        method: t.Optional(t.String({ minLength: 1 })),
      }),
      detail: {
        summary: "Update a tool by name",
        description:
          "Updates the details of an existing tool by its name. The tool details include the tool name, description, parameters, endpoint, and method. These details are required to update an existing tool. whatever different details are provided will be updated.",
        tags: ["Tool"],
      },
    },
  )

  // Delete a tool
  .delete(
    "/:name",
    async ({ params: { name }, error }) => {
      const [deletedTool, err] = await handle(deleteTool(name));
      if (err) {
        log.error(err.message);
        return error(500, "Error deleting tool");
      }
      if (!deletedTool) {
        return error(404, "Tool not found");
      }
      return { message: "Tool deleted successfully" };
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Delete a tool by name",
        description:
          "Deletes a tool by its name. This operation is irreversible and will delete all the details associated with the tool.",
        tags: ["Tool"],
      },
    },
  );
