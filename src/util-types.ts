import { t, type TSchema } from "elysia";

export const Nullable = <T extends TSchema>(schema: T) =>
  t.Union([t.Null(), schema]);
