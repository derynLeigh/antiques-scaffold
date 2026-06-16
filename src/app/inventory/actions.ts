"use server";

import { randomUUID } from "crypto";
import sharp from "sharp";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
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

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — matches serverActions.bodySizeLimit

export async function createItem(formData: FormData): Promise<void> {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  const description = (formData.get("description") as string)?.trim();
  const pricePounds = formData.get("price") as string;
  const status = formData.get("status") as string;
  const location = formData.get("location") as string;
  const listingUrl = (formData.get("listingUrl") as string)?.trim() || null;
  const condition = (formData.get("condition") as string)?.trim() || null;
  const dimensions = (formData.get("dimensions") as string)?.trim() || null;
  const costPounds = formData.get("cost") as string;
  const image = formData.get("image") as File | null;

  // --- Validation: fail loudly rather than writing bad data ---
  if (!description) throw new Error("Description is required");

  // Price arrives as pounds (e.g. "42.50"); store as integer pennies.
  const pounds = Number(pricePounds);
  if (!Number.isFinite(pounds) || pounds < 0) {
    throw new Error("Price must be a non-negative number");
  }
  const pricePence = Math.round(pounds * 100);

  // Cost: same pounds → pennies conversion. Required (always known).
  const cost = Number(costPounds);
  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error("Cost must be a non-negative number");
  }
  const costPence = Math.round(cost * 100);

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
    condition,
    dimensions,
    pricePence,
    costPence,
    status,
    location,
    listingUrl,
    imageKey,
    thumbKey,
  });

  revalidatePath("/inventory");
  redirect("/inventory");
}

/**
 * Shared image-processing helper. Takes an uploaded File, produces the
 * full + thumbnail webp pair, uploads both to R2, and returns their keys.
 * Extracted so create and update don't duplicate the sharp/R2 logic.
 */
async function processAndUploadImage(
  image: File
): Promise<{ imageKey: string; thumbKey: string }> {
  if (image.size > MAX_BYTES) {
    throw new Error("Image is too large (max 8 MB)");
  }

  const inputBuffer = Buffer.from(await image.arrayBuffer());

  const [fullBuffer, thumbBuffer] = await Promise.all([
    sharp(inputBuffer)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer(),
    sharp(inputBuffer)
      .rotate()
      .resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true })
      .webp({ quality: 75 })
      .toBuffer(),
  ]);

  const id = randomUUID();
  const imageKey = `items/${id}/full.webp`;
  const thumbKey = `items/${id}/thumb.webp`;

  await Promise.all([
    r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: imageKey, Body: fullBuffer, ContentType: "image/webp" })),
    r2.send(new PutObjectCommand({ Bucket: R2_BUCKET, Key: thumbKey, Body: thumbBuffer, ContentType: "image/webp" })),
  ]);

  return { imageKey, thumbKey };
}

/**
 * Best-effort deletion of an item's R2 objects. Used when replacing an
 * image (remove the old pair) or deleting an item. Failures here are
 * logged but not fatal — an orphaned object in R2 is harmless and
 * cheaper to tolerate than blocking the user's action on a storage hiccup.
 */
async function deleteImageObjects(
  imageKey: string | null,
  thumbKey: string | null
): Promise<void> {
  const keys = [imageKey, thumbKey].filter((k): k is string => Boolean(k));
  await Promise.all(
    keys.map((Key) =>
      r2
        .send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key }))
        .catch((e) => console.error("R2 delete failed for", Key, e))
    )
  );
}

/**
 * Server action: update one item.
 *
 * Mirrors createItem's validation. Two extra concerns over create:
 *
 *  - Status → sold transition: if status changes to "sold" and wasn't
 *    before, stamp soldAt now. If it changes back to for_sale, clear it.
 *    This keeps soldAt meaning "when it sold" rather than "last edited".
 *
 *  - Image replacement: if a new image is uploaded, process it and delete
 *    the OLD R2 objects so they don't orphan. If no new image, keep the
 *    existing keys untouched.
 */
export async function updateItem(id: number, formData: FormData): Promise<void> {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  const [existing] = await db.select().from(items).where(eq(items.id, id)).limit(1);
  if (!existing) throw new Error("Item not found");

  const description = (formData.get("description") as string)?.trim();
  const condition = (formData.get("condition") as string)?.trim() || null;
  const dimensions = (formData.get("dimensions") as string)?.trim() || null;
  const listingUrl = (formData.get("listingUrl") as string)?.trim() || null;
  const status = formData.get("status") as string;
  const location = formData.get("location") as string;
  const image = formData.get("image") as File | null;

  if (!description) throw new Error("Description is required");

  const pounds = Number(formData.get("price"));
  if (!Number.isFinite(pounds) || pounds < 0) {
    throw new Error("Price must be a non-negative number");
  }
  const pricePence = Math.round(pounds * 100);

  const cost = Number(formData.get("cost"));
  if (!Number.isFinite(cost) || cost < 0) {
    throw new Error("Cost must be a non-negative number");
  }
  const costPence = Math.round(cost * 100);

  if (status !== "for_sale" && status !== "sold") throw new Error("Invalid status");
  if (location !== "centre_a" && location !== "centre_b") throw new Error("Invalid location");

  // soldAt logic: set on transition INTO sold, clear on transition OUT.
  let soldAt = existing.soldAt;
  if (status === "sold" && existing.status !== "sold") {
    soldAt = new Date();
  } else if (status === "for_sale" && existing.status === "sold") {
    soldAt = null;
  }

  // Image: replace only if a new file was supplied.
  let imageKey = existing.imageKey;
  let thumbKey = existing.thumbKey;
  if (image && image.size > 0) {
    const uploaded = await processAndUploadImage(image);
    // Delete the old pair after the new one is safely stored.
    await deleteImageObjects(existing.imageKey, existing.thumbKey);
    imageKey = uploaded.imageKey;
    thumbKey = uploaded.thumbKey;
  }

  await db
    .update(items)
    .set({
      description,
      condition,
      dimensions,
      pricePence,
      costPence,
      status,
      location,
      listingUrl,
      imageKey,
      thumbKey,
      soldAt,
      updatedAt: new Date(),
    })
    .where(eq(items.id, id));

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  redirect(`/inventory/${id}`);
}

/**
 * Server action: delete one item and its R2 objects.
 *
 * Deletes the database row, then best-effort removes the image objects.
 * Row deletion is the source of truth; if the R2 cleanup fails the item
 * is still gone from the app, with only harmless orphaned objects left.
 */
export async function deleteItem(id: number): Promise<void> {
  const session = await auth();
  if (!session) throw new Error("Unauthorised");

  const [existing] = await db.select().from(items).where(eq(items.id, id)).limit(1);
  if (!existing) throw new Error("Item not found");

  await db.delete(items).where(eq(items.id, id));
  await deleteImageObjects(existing.imageKey, existing.thumbKey);

  revalidatePath("/inventory");
  redirect("/inventory");
}
