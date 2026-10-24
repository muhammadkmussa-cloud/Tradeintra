import { z } from "zod";
import {
  LEGACY_SLUG_PATTERN,
  LOGO_PATTERN,
  MAX_LOGO_LENGTH,
  SLUG_PATTERN,
} from "../../studio";
import { isModuleKey, normalizeModules } from "../../studio-modules";
export const configSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    slug: z.string().regex(SLUG_PATTERN),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    theme: z.enum(["light", "dark"]).optional(),
    logo: z
      .string()
      .max(MAX_LOGO_LENGTH)
      .regex(LOGO_PATTERN, "Upload a smaller PNG, JPG, or WebP logo.")
      .optional(),
    headline: z.string().trim().min(1).max(100),
    description: z.string().max(240),
    modules: z
      .array(z.string().max(30))
      .min(1)
      .max(20)
      .refine((v) => v.every(isModuleKey), "Choose supported modules only.")
      .transform((v) => normalizeModules(v))
      .refine((v) => v.length <= 20, "Choose at most 20 modules."),
    moduleContent: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export const publishedConfigSchema = configSchema.extend({
  slug: z.string().regex(LEGACY_SLUG_PATTERN),
});
export const loginSchema = z
  .object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(8).max(128),
    mfaCode: z.string().trim().max(12).optional(),
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
