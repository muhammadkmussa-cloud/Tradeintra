import { z } from "zod";
import { LEGACY_SLUG_PATTERN, SLUG_PATTERN } from "../../studio";
export const configSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    slug: z.string().regex(SLUG_PATTERN),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    headline: z.string().trim().min(1).max(100),
    description: z.string().max(240),
    modules: z
      .array(z.enum(["markets", "terminal", "about"]))
      .max(3)
      .refine((v) => new Set(v).size === v.length, "Choose each module once."),
  })
  .strict();
export const publishedConfigSchema = configSchema.extend({
  slug: z.string().regex(LEGACY_SLUG_PATTERN),
});
export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(128),
  })
  .strict();
export const registerSchema = z
  .object({
    fullName: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(254),
    password: z
      .string()
      .min(8)
      .max(128)
      .regex(/[A-Z]/, "Include one uppercase letter.")
      .regex(/[0-9]/, "Include one number."),
    referralCode: z
      .string()
      .trim()
      .toUpperCase()
      .regex(/^TRD-[A-F0-9]{8}$/)
      .optional(),
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
