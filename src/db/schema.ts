import { pgTable, text, jsonb, timestamp } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

export const contextsTable = pgTable("contexts", {
  id: text("id").primaryKey(),
  platform: text("platform"),
  description: text("description"),
  default_agent_id: text("default_agent_id").references(() => agentsTable.id),
  authors: jsonb("authors").$type<string[]>(),
});

export const messagesTable = pgTable("messages", {
  id: text("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  callId: text("call_id"),
  calls: jsonb("calls"),
  role: text("role"),
  name: text("name"),
  content: text("content"),
  context_id: text("context_id").references(() => contextsTable.id),
  author_id: text("author_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentsTable = pgTable("agents", {
  id: text("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  name: text("name").unique().notNull(),
  description: text("description"),
  prompt: text("prompt").notNull(),
  primaryModel: text("primary_model").notNull(),
  fallbackModels: jsonb("fallback_models"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const toolsTable = pgTable("tools", {
  id: text("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  name: text("name").unique().notNull(),
  description: text("description"),
  params: jsonb("params"),
  endpoint: text("endpoint").notNull(),
  method: text("method").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const agentToolsTable = pgTable("agent_tools", {
  agentId: text("agent_id")
    .notNull()
    .references(() => agentsTable.id, { onDelete: "cascade" }),
  toolId: text("tool_id")
    .notNull()
    .references(() => toolsTable.id, { onDelete: "cascade" }),
});

export const agentsRelations = relations(agentsTable, ({ many }) => ({
  tools: many(agentToolsTable),
}));

export const toolsRelations = relations(toolsTable, ({ many }) => ({
  agents: many(agentToolsTable),
}));

export const agentToolsRelations = relations(agentToolsTable, ({ one }) => ({
  agent: one(agentsTable, {
    fields: [agentToolsTable.agentId],
    references: [agentsTable.id],
  }),
  tool: one(toolsTable, {
    fields: [agentToolsTable.toolId],
    references: [toolsTable.id],
  }),
}));

export const knowledgeBaseTable = pgTable("knowledge_bases", {
  id: text("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  name: text("name").unique().notNull(),
  embedding_model: text("embedding_model").notNull(),
  models: jsonb("models").$type<string[]>(),
  database_provider: text("database_provider").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
