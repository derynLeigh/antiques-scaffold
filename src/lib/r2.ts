import { S3Client } from "@aws-sdk/client-s3";

/**
 * R2 client. R2 is S3-compatible, so we use the standard AWS S3 SDK
 * pointed at Cloudflare's endpoint — there's no R2-specific SDK.
 *
 * region: "auto" is required by the SDK but ignored by R2.
 * The credentials come from a SCOPED R2 API token (Object Read & Write
 * on this one bucket), never your main Cloudflare key — least privilege.
 *
 * R2_PUBLIC_URL is the public base for serving objects (your bucket's
 * public r2.dev URL, or a custom domain). Because we chose a public
 * bucket, every stored object has a permanent URL at
 * `${R2_PUBLIC_URL}/${key}` — no signing needed.
 */
function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing required env var: ${name}`);
  return v;
}

export const r2 = new S3Client({
  region: "auto",
  endpoint: required("R2_ENDPOINT"),
  credentials: {
    accessKeyId: required("R2_ACCESS_KEY_ID"),
    secretAccessKey: required("R2_SECRET_ACCESS_KEY"),
  },
});

export const R2_BUCKET = required("R2_BUCKET_NAME");

// Public base URL for reading objects back (no trailing slash).
export const R2_PUBLIC_URL = required("R2_PUBLIC_URL").replace(/\/$/, "");

export function publicUrl(key: string): string {
  return `${R2_PUBLIC_URL}/${key}`;
}
