import { pgTable, text, jsonb, timestamp, integer } from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { ScalingConfig } from "../lib/inference/types";

export const contextsTable = pgTable("contexts", {
  id: text("id").primaryKey(),
  platform: text("platform"),
  description: text("description"),
  default_agent_id: text("default_agent_id").references(() => agentsTable.id),
  authors: jsonb("authors").$type<string[]>(),
  scaling_algorithm: text("scaling_algorithm").$type<
    "window" | "threshold" | "block"
  >(),
  scaling_config: jsonb("scaling_config").$type<ScalingConfig>(),
  tag: text("tag"),
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
  tag: text("tag"),
});

export const summariesTable = pgTable("summaries", {
  id: text("id")
    .primaryKey()
    .notNull()
    .default(sql`gen_random_uuid()`),
  context_id: text("context_id").references(() => contextsTable.id),
  start_message_id: text("start_message_id").references(() => messagesTable.id),
  end_message_id: text("end_message_id").references(() => messagesTable.id),
  summary_content: text("summary_content"),
  created_at: timestamp("created_at").defaultNow(),
  block_number: integer("block_number"),
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
  fallbackModels: jsonb("fallback_models").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow(),
  format: text("format"),
  tag: text("tag"),
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
  tag: text("tag"),
});

export const agentToolsTable = pgTable("agent_tools", {
  agentId: text("agent_id")
    .notNull()
    .references(() => agentsTable.id, { onDelete: "cascade" }),
  toolId: text("tool_id")
    .notNull()
    .references(() => toolsTable.id, { onDelete: "cascade" }),
});

export const agentHelperTable = pgTable("agent_helpers", {
  mainAgentId: text("main_agent_id")
    .notNull()
    .references(() => agentsTable.id, { onDelete: "cascade" }),
  helperAgentId: text("helper_agent_id")
    .notNull()
    .references(() => agentsTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Simplified relations syntax
export const agentsRelations = relations(agentsTable, ({ many }) => ({
  tools: many(agentToolsTable),
  mainAgentConnections: many(agentHelperTable),
  helperAgentConnections: many(agentHelperTable),
}));

// Helper table relations
export const agentHelperRelations = relations(agentHelperTable, ({ one }) => ({
  mainAgent: one(agentsTable, {
    fields: [agentHelperTable.mainAgentId],
    references: [agentsTable.id],
  }),
  helperAgent: one(agentsTable, {
    fields: [agentHelperTable.helperAgentId],
    references: [agentsTable.id],
  }),
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
  tag: text("tag"),
});

export const agentKnowledgeBasesTable = pgTable("agent_knowledge_bases", {
  agentId: text("agent_id")
    .notNull()
    .references(() => agentsTable.id, { onDelete: "cascade" }),
  knowledgeBaseId: text("knowledge_base_id")
    .notNull()
    .references(() => knowledgeBaseTable.id, { onDelete: "cascade" }),
});
