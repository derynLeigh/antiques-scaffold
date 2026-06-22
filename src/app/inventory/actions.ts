"use server";

import { randomUUID } from "crypto";
import sharp from "sharp";
import { PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { getSession } from "@/auth";
import { db } from "@/db";
import { items } from "@/db/schema";
import { r2, R2_BUCKET } from "@/lib/r2";

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — matches serverActions.bodySizeLimit

/**
 * Form state returned to the client. `error` holds a user-facing validation
 * message; the form displays it via useActionState. Validation failures
 * RETURN this (user can fix and resubmit); genuine faults (unauthorised,
 * not-found, infra) still THROW to the error boundary, since they aren't
 * user-fixable. On success the action redirects and nothing is returned.
 */
export type FormState = { error?: string };

/**
 * Parse and validate the shared item fields from a form. Returns either a
 * validated values object or an error message — no throwing for user input,
 * so create/update can surface a friendly message on the form.
 */
function parseItemForm(formData: FormData):
  | { ok: true; values: {
      description: string; condition: string | null; dimensions: string | null;
      pricePence: number; costPence: number;
      status: "for_sale" | "sold"; location: "centre_a" | "centre_b";
      listingUrl: string | null;
    } }
  | { ok: false; error: string } {
  const description = (formData.get("description") as string)?.trim();
  const condition = (formData.get("condition") as string)?.trim() || null;
  const dimensions = (formData.get("dimensions") as string)?.trim() || null;
  const listingUrl = (formData.get("listingUrl") as string)?.trim() || null;
  const status = formData.get("status") as string;
  const location = formData.get("location") as string;

  if (!description) return { ok: false, error: "Description is required." };

  const pounds = Number(formData.get("price"));
  if (!Number.isFinite(pounds) || pounds < 0)
    return { ok: false, error: "Price must be a non-negative number." };
  const pricePence = Math.round(pounds * 100);

  const cost = Number(formData.get("cost"));
  if (!Number.isFinite(cost) || cost < 0)
    return { ok: false, error: "Cost must be a non-negative number." };
  const costPence = Math.round(cost * 100);

  if (status !== "for_sale" && status !== "sold")
    return { ok: false, error: "Please choose a valid status." };
  if (location !== "centre_a" && location !== "centre_b")
    return { ok: false, error: "Please choose a valid location." };

  if (listingUrl) {
    try {
      new URL(listingUrl);
    } catch {
      return { ok: false, error: "Listing URL must be a valid URL (including https://)." };
    }
  }

  return {
    ok: true,
    values: { description, condition, dimensions, pricePence, costPence, status, location, listingUrl },
  };
}

export async function createItem(prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorised");

  const parsed = parseItemForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const v = parsed.values;

  const image = formData.get("image") as File | null;
  let imageKey: string | null = null;
  let thumbKey: string | null = null;
  if (image && image.size > 0) {
    if (image.size > MAX_BYTES) return { error: "Image is too large (max 5 MB)." };
    const uploaded = await processAndUploadImage(image);
    imageKey = uploaded.imageKey;
    thumbKey = uploaded.thumbKey;
  }

  await db.insert(items).values({
    description: v.description, condition: v.condition, dimensions: v.dimensions,
    pricePence: v.pricePence, costPence: v.costPence,
    status: v.status, location: v.location, listingUrl: v.listingUrl, imageKey, thumbKey,
  });

  revalidatePath("/inventory");
  redirect("/inventory?saved=added");
}

async function processAndUploadImage(image: File): Promise<{ imageKey: string; thumbKey: string }> {
  if (image.size > MAX_BYTES) throw new Error("Image is too large (max 5 MB)");
  const inputBuffer = Buffer.from(await image.arrayBuffer());
  const [fullBuffer, thumbBuffer] = await Promise.all([
    sharp(inputBuffer).rotate().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
    sharp(inputBuffer).rotate().resize({ width: 400, height: 400, fit: "inside", withoutEnlargement: true }).webp({ quality: 75 }).toBuffer(),
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

async function deleteImageObjects(imageKey: string | null, thumbKey: string | null): Promise<void> {
  const keys = [imageKey, thumbKey].filter((k): k is string => Boolean(k));
  await Promise.all(keys.map((Key) =>
    r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key })).catch((e) => console.error("R2 delete failed for", Key, e))
  ));
}

export async function updateItem(id: number, prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorised");

  const [existing] = await db.select().from(items).where(eq(items.id, id)).limit(1);
  if (!existing) throw new Error("Item not found");

  const parsed = parseItemForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const v = parsed.values;

  let soldAt = existing.soldAt;
  if (v.status === "sold" && existing.status !== "sold") soldAt = new Date();
  else if (v.status === "for_sale" && existing.status === "sold") soldAt = null;

  const image = formData.get("image") as File | null;
  let imageKey = existing.imageKey;
  let thumbKey = existing.thumbKey;
  if (image && image.size > 0) {
    if (image.size > MAX_BYTES) return { error: "Image is too large (max 5 MB)." };
    const uploaded = await processAndUploadImage(image);
    await deleteImageObjects(existing.imageKey, existing.thumbKey);
    imageKey = uploaded.imageKey;
    thumbKey = uploaded.thumbKey;
  }

  await db.update(items).set({
    description: v.description, condition: v.condition, dimensions: v.dimensions,
    pricePence: v.pricePence, costPence: v.costPence,
    status: v.status, location: v.location, listingUrl: v.listingUrl,
    imageKey, thumbKey, soldAt, updatedAt: new Date(),
  }).where(eq(items.id, id));

  revalidatePath("/inventory");
  revalidatePath(`/inventory/${id}`);
  redirect("/inventory?saved=updated");
}

export async function deleteItem(id: number): Promise<void> {
  const session = await getSession();
  if (!session) throw new Error("Unauthorised");
  const [existing] = await db.select().from(items).where(eq(items.id, id)).limit(1);
  if (!existing) throw new Error("Item not found");
  await db.delete(items).where(eq(items.id, id));
  await deleteImageObjects(existing.imageKey, existing.thumbKey);
  revalidatePath("/inventory");
  redirect("/inventory");
}
