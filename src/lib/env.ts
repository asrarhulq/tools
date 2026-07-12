import { z } from "zod";

/**
 * Runtime-validated environment variables.
 *
 * Import `env` from here instead of reading `process.env` directly so that a
 * missing or malformed variable fails fast at startup with a clear message,
 * and every consumer gets a fully-typed value.
 *
 * Only `NEXT_PUBLIC_*` variables are safe to reference in Client Components;
 * server-only secrets belong in the `server` schema below.
 */
const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SITE_NAME: z.string().min(1),
});

const parsed = clientSchema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SITE_NAME: process.env.NEXT_PUBLIC_SITE_NAME,
});

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:",
    z.flattenError(parsed.error).fieldErrors,
  );
  throw new Error("Invalid environment variables. See .env.example.");
}

export const env = parsed.data;
