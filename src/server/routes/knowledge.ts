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
import { handle, log } from "../../lib/utils";

export const knowledgeRoute = new Elysia({ prefix: "/knowledge" })
  .get(
    "/",
    async ({ error }) => {
      const [knowledgeBases, err] = await handle(listAllKnowledgeBases());
      if (err) {
        log.error(err.message);
        return error(500, "Error retrieving knowledge bases");
      }
      return knowledgeBases;
    },
    {
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
      const [knowledgeBase, err] = await handle(getKnowledgeBaseByName(name));
      if (err) {
        log.error(err.message);
        return error(500, "Error retrieving knowledge base");
      }
      if (!knowledgeBase) {
        return error(404, "Knowledge base not found");
      }
      return knowledgeBase;
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      detail: {
        summary: "Get knowledge base by name",
        description: "Gets the details of a knowledge base by its name.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .post(
    "/create",
    async ({ body, error }) => {
      const [newKnowledgeBase, err] = await handle(createKnowledgeBase(body));
      if (err) {
        log.error(err.message);
        return error(500, "Error creating knowledge base");
      }
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
      const [result, err] = await handle(
        addDocumentToKnowledgeBase(body, name),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error adding document to knowledge base");
      }
      return result;
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
      const [result, err] = await handle(
        addDocumentsToKnowledgeBase(body, name),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error adding documents to knowledge base");
      }
      return result;
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
      detail: {
        summary: "Add multiple documents to knowledge base",
        description:
          "Adds multiple new documents to the specified knowledge base.",
        tags: ["Knowledge Base"],
      },
    },
  )
  .put(
    "/:name/update-document",
    async ({ params: { name }, body, error }) => {
      const [result, err] = await handle(
        updateDocumentInKnowledgeBase(body, name),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error updating document in knowledge base");
      }
      return result;
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
      const [_, err] = await handle(
        removeDocumentFromKnowledgeBase(documentId, name),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error removing document from knowledge base");
      }
      return { message: "Document removed successfully" };
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
        documentId: t.String({ minLength: 1 }),
      }),
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
      const [documents, err] = await handle(
        getDocumentsFromKnowledgeBase(query as Record<string, string>, name),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error retrieving documents from knowledge base");
      }
      return documents;
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
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
      const [result, err] = await handle(deleteKnowledgeBase(name));
      if (err) {
        log.error(err.message);
        return error(500, "Error deleting knowledge base");
      }
      return result;
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
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
      const [result, err] = await handle(resetKnowledgeBase(name));
      if (err) {
        log.error(err.message);
        return error(500, "Error resetting knowledge base");
      }
      return result;
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
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
      const [result, err] = await handle(updateKnowledgeBase(name, body));
      if (err) {
        log.error(err.message);
        return error(500, "Error updating knowledge base");
      }
      return result;
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      body: t.Object({
        embedding_model: t.Optional(t.String({ minLength: 4, maxLength: 255 })),
        description: t.Optional(t.String({ maxLength: 255 })),
      }),
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
      const { q, k, model, similarity_threshold } = query;
      const [results, err] = await handle(
        searchKnowledgeBase(name, q, parseInt(k), model, similarity_threshold),
      );
      if (err) {
        log.error(err.message);
        return error(500, "Error searching knowledge base");
      }
      return results;
    },
    {
      params: t.Object({
        name: t.String({ minLength: 4, maxLength: 255 }),
      }),
      query: t.Object({
        q: t.String({ minLength: 1 }),
        k: t.String({ pattern: "^[0-9]+$" }),
        model: t.Optional(t.String({ minLength: 4, maxLength: 255 })),
        similarity_threshold: t.Optional(t.Number({ minimum: 0, maximum: 1 })),
      }),
      detail: {
        summary: "Search knowledge base",
        description:
          "Performs a similarity search on the specified knowledge base.",
        tags: ["Knowledge Base"],
      },
    },
  );
