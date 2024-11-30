import { Elysia, t } from "elysia";
import {
  listAllKnowledgeBases,
  getKnowledgeBaseByName,
} from "../../db/knowledge";
import {
  createKnowledgeBase,
  addDocumentToKnowledgeBase,
  updateDocumentInKnowledgeBase,
  removeDocumentFromKnowledgeBase,
  getDocumentsFromKnowledgeBase,
  deleteKnowledgeBase,
  updateKnowledgeBase,
  searchKnowledgeBase,
  supported_database_providers,
  resetKnowledgeBase,
  addDocumentsToKnowledgeBase,
} from "../../lib/knowledge";
import { Nullable } from "../../util-types";
import {
  DatabaseDocument,
  SearchResultSchema,
} from "../../lib/knowledge/types";
import { logger } from "@bogeychan/elysia-logger";

export const knowledgeRoute = new Elysia({ prefix: "/knowledge" })
  .get(
    "/",
    async () => {
      const knowledgeBases = await listAllKnowledgeBases();
      return knowledgeBases;
    },
    {
      response: t.Array(
        t.Object({
          name: t.String(),
          description: Nullable(t.Optional(t.String())),
          embedding_model: t.String(),
          database_provider: t.String(),
        }),
      ),
      detail: {
        summary: "Get all knowledge bases",
        description:
          "Get all knowledge bases in the system and their details such as name, description, embedding model, and database provider.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .get(
    "/:name",
    async ({ params: { name }, error }) => {
      const knowledgeBase = await getKnowledgeBaseByName(name);
      if (!knowledgeBase) {
        return error(404, "Knowledge base not found");
      }
      return knowledgeBase;
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      response: {
        404: t.String(),
        200: t.Object({
          name: t.String(),
          description: Nullable(t.Optional(t.String())),
          embedding_model: t.String(),
          database_provider: t.String(),
          createdAt: t.Date(),
        }),
      },
      detail: {
        summary: "Get knowledge base by name",
        description: "Gets the details of a knowledge base by its name.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .post(
    "/create",
    async ({ body }) => {
      const newKnowledgeBase = await createKnowledgeBase(body);
      return newKnowledgeBase;
    },
    {
      body: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
        description: t.Optional(t.String({ maxLength: 255 })),
        embedding_model: t.String({ minLength: 4, maxLength: 255 }),
        database_provider: t.Union(
          supported_database_providers.map((p) => t.Literal(p)),
          {
            default: supported_database_providers[0],
          },
        ),
      }),
      response: {
        200: t.Object({
          id: t.String(),
        }),
      },
      detail: {
        summary: "Create a new knowledge base",
        description: "Creates a new knowledge base with the provided details.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .post(
    "/:name/add-document",
    async ({ params: { name }, body, error }) => {
      try {
        const result = await addDocumentToKnowledgeBase(body, name);
        return result;
      } catch (err) {
        return error(404, (err as Error).message);
      }
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        content: t.String({ minLength: 1 }),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
        model: t.Optional(t.String({ minLength: 4, maxLength: 255 })),
      }),
      response: {
        200: t.Object({
          id: t.String(),
        }),
        404: t.String(),
      },

      detail: {
        summary: "Add document to knowledge base",
        description: "Adds a new document to the specified knowledge base.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .post(
    "/:name/add-documents",
    async ({ params: { name }, body, error }) => {
      try {
        const result = await addDocumentsToKnowledgeBase(body, name);
        return result;
      } catch (err) {
        return error(404, (err as Error).message);
      }
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Array(
        t.Object({
          content: t.String({ minLength: 1 }),
          metadata: t.Optional(t.Record(t.String(), t.Any())),
          model: t.Optional(t.String({ minLength: 4, maxLength: 255 })),
        }),
      ),
      response: {
        200: t.Array(
          t.Object({
            id: t.String(),
          }),
        ),
        404: t.String(),
      },

      detail: {
        summary: "Add multiple documents to knowledge base",
        description:
          "Adds a multiple new documents to the specified knowledge base.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .put(
    "/:name/update-document",
    async ({ params: { name }, body, error }) => {
      try {
        const result = await updateDocumentInKnowledgeBase(body, name);
        return result;
      } catch (err) {
        return error(404, (err as Error).message);
      }
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        id: t.String({ minLength: 1 }),
        content: t.Optional(t.String({ minLength: 1 })),
        metadata: t.Optional(t.Record(t.String(), t.Any())),
      }),
      response: {
        200: t.Object({
          id: t.String(),
        }),
        404: t.String(),
      },
      detail: {
        summary: "Update document in knowledge base",
        description:
          "Updates an existing document in the specified knowledge base.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .delete(
    "/:name/remove-document/:documentId",
    async ({ params: { name, documentId }, error }) => {
      try {
        await removeDocumentFromKnowledgeBase(documentId, name);
        return { message: "Document removed successfully" };
      } catch (err) {
        return error(404, (err as Error).message);
      }
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
        documentId: t.String({ minLength: 1 }),
      }),
      response: {
        200: t.Object({
          message: t.String(),
        }),
        404: t.String(),
      },
      detail: {
        summary: "Remove document from knowledge base",
        description: "Removes a document from the specified knowledge base.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .get(
    "/:name/documents",
    async ({ params: { name }, query, error }) => {
      try {
        const documents = await getDocumentsFromKnowledgeBase(
          query as Record<string, string>,
          name,
        );
        return documents;
      } catch (err) {
        return error(404, (err as Error).message);
      }
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      response: {
        200: t.Array(DatabaseDocument),
        404: t.String(),
      },
      query: t.Object({}),
      detail: {
        summary: "Get documents from knowledge base",
        description:
          "Retrieves documents from the specified knowledge base based on the provided filter.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .delete(
    "/:name",
    async ({ params: { name }, error }) => {
      try {
        const result = await deleteKnowledgeBase(name);
        return result;
      } catch (err) {
        return error(404, (err as Error).message);
      }
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      response: {
        200: t.Object({
          message: t.String(),
        }),
        404: t.String(),
        400: t.String(),
      },
      detail: {
        summary: "Delete knowledge base",
        description:
          "Deletes the specified knowledge base and its associated data.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .delete(
    "/:name/reset",
    async ({ params: { name }, error }) => {
      try {
        const result = await resetKnowledgeBase(name);
        return result;
      } catch (err) {
        console.log(err);
        return error(404, (err as Error).message);
      }
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      response: {
        200: t.Object({
          message: t.String(),
        }),
        404: t.String(),
        400: t.String(),
      },
      detail: {
        summary: "Reset knowledge base",
        description:
          "Resets the specified knowledge base deleting all its document data.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .put(
    "/:name",
    async ({ params: { name }, body, error }) => {
      try {
        const result = await updateKnowledgeBase(name, body);
        return result;
      } catch (err) {
        return error(404, (err as Error).message);
      }
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        embedding_model: t.Optional(t.String({ minLength: 4, maxLength: 255 })),
        description: t.Optional(t.String({ maxLength: 255 })),
      }),
      response: {
        200: t.Object({
          name: t.String(),
          description: Nullable(t.Optional(t.String())),
          embedding_model: t.String(),
          database_provider: t.String(),
          createdAt: t.Date(),
        }),
        404: t.String(),
      },
      detail: {
        summary: "Update knowledge base",
        description:
          "Updates the embedding model and/or description of the specified knowledge base.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .get(
    "/:name/search",
    async ({ params: { name }, query, error }) => {
      try {
        const { q, k, model } = query;
        const results = await searchKnowledgeBase(name, q, parseInt(k), model);
        return results;
      } catch (err) {
        return error(404, (err as Error).message);
      }
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      query: t.Object({
        q: t.String({ minLength: 1 }),
        k: t.String({ pattern: "^[0-9]+$" }),
        model: t.Optional(t.String({ minLength: 4, maxLength: 255 })),
      }),
      response: {
        200: t.Array(SearchResultSchema),
        404: t.String(),
      },
      detail: {
        summary: "Search knowledge base",
        description:
          "Performs a similarity search on the specified knowledge base.",
        tags: ["Knowledge Base"],
      },
    },
  );
