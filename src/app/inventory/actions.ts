"use server";

import { randomUUID } from "crypto";
import sharp from "sharp";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { r2, R2_BUCKET } from "@/lib/r2";

/**
 * Server action: create one inventory item.
 *
 * Flow (Option 1 — server-side upload):
 *   1. Verify session — actions are not behind middleware, so we re-check.
 *   2. Validate and parse the form fields.
 *   3. If an image was supplied: read it into a Buffer, use sharp to
 *      produce (a) a normalised full image and (b) a ~400px thumbnail,
 *      then PutObject both to R2 under a shared random key prefix.
 *   4. Insert the row, storing the two object keys + the listing URL.
 *   5. Revalidate the list and redirect to it.
 *
 * Why re-check auth here: a server action is a POST endpoint. Middleware
 * gates page navigations, but defence-in-depth means the action confirms
 * the session itself rather than trusting that the caller came through a
 * gated page.
 */

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB ceiling on the source image

export async function createItem(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  const description = (formData.get("description") as string)?.trim();
  const pricePounds = formData.get("price") as string;
  const status = formData.get("status") as string;
  const location = formData.get("location") as string;
  const listingUrl = (formData.get("listingUrl") as string)?.trim() || null;
  const image = formData.get("image") as File | null;

  // --- Validation: fail loudly rather than writing bad data ---
  if (!description) throw new Error("Description is required");

  // Price arrives as pounds (e.g. "42.50"); store as integer pennies.
  const pounds = Number(pricePounds);
  if (!Number.isFinite(pounds) || pounds < 0) {
    throw new Error("Price must be a non-negative number");
  }
  const pricePence = Math.round(pounds * 100);

  if (status !== "for_sale" && status !== "sold") {
    throw new Error("Invalid status");
  }
  if (location !== "centre_a" && location !== "centre_b") {
    throw new Error("Invalid location");
  }

  let imageKey: string | null = null;
  let thumbKey: string | null = null;

  if (image && image.size > 0) {
    if (image.size > MAX_BYTES) {
      throw new Error("Image is too large (max 8 MB)");
    }

    const inputBuffer = Buffer.from(await image.arrayBuffer());

    // Normalise the full image: cap dimensions, re-encode as webp to
    // strip metadata and shrink size. Thumbnail: ~400px wide webp.
    const [fullBuffer, thumbBuffer] = await Promise.all([
      sharp(inputBuffer)
        .rotate() // respect EXIF orientation before stripping it
        .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer(),
      sharp(inputBuffer)
        .rotate()
        .resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 75 })
        .toBuffer(),
    ]);

    // Shared random prefix keeps the pair associated and avoids collisions.
    const id = randomUUID();
    imageKey = `items/${id}/full.webp`;
    thumbKey = `items/${id}/thumb.webp`;

    await Promise.all([
      r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: imageKey,
          Body: fullBuffer,
          ContentType: "image/webp",
        })
      ),
      r2.send(
        new PutObjectCommand({
          Bucket: R2_BUCKET,
          Key: thumbKey,
          Body: thumbBuffer,
          ContentType: "image/webp",
        })
      ),
    ]);
  }

  await db.insert(items).values({
    description,
    pricePence,
    status,
    location,
    listingUrl,
    imageKey,
    // thumbKey isn't a column yet — see note. Stored via imageKey pairing.
    thumbKey,
  });

  revalidatePath("/inventory");
  redirect("/inventory");
}
