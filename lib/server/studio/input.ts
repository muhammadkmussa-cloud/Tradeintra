import { z } from "zod";
export const configSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    slug: z.string().regex(/^[a-z0-9](?:[a-z0-9-]{1,38}[a-z0-9])$/),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    headline: z.string().trim().min(1).max(100),
    description: z.string().max(240),
    modules: z
      .array(z.enum(["markets", "terminal", "about"]))
      .max(3)
      .refine((v) => new Set(v).size === v.length, "Choose each module once."),
  })
  .strict();
export const credentialsSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(12).max(128),
  })
  .strict();
const base = {
  revision: z.number().int().min(0),
  operationId: z.string().uuid(),
};
export const actionSchema = z.discriminatedUnion("kind", [
  z
    .object({
      ...base,
      kind: z.literal("save"),
      id: z.string().uuid().optional(),
      config: configSchema,
      publish: z.boolean(),
    })
    .strict(),
  z
    .object({ ...base, kind: z.literal("publish"), id: z.string().uuid() })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal("restore"),
      id: z.string().uuid(),
      number: z.number().int().min(1),
    })
    .strict(),
  z
    .object({ ...base, kind: z.literal("archive"), id: z.string().uuid() })
    .strict(),
  z
    .object({
      ...base,
      kind: z.literal("settings"),
      workspace: z.string().trim().min(1).max(40),
      derivLinked: z.boolean(),
    })
    .strict(),
]);
export type StudioAction = z.infer<typeof actionSchema>;
