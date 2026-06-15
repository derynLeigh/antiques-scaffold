import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { updateItem, deleteItem } from "../../actions";
import { DeleteButton } from "./DeleteButton";

/**
 * Edit form at /inventory/[id]/edit.
 *
 * Same fields as the create form, pre-filled with the item's current
 * values. The form posts to updateItem with the id bound via .bind() —
 * server actions can be partially applied this way, so the action
 * receives (id, formData).
 *
 * Delete lives here too, as a separate form posting to deleteItem. It's a
 * distinct <form> (not nested — HTML forms can't nest) with its own bound
 * action. A confirm() guard on the button avoids accidental deletion.
 *
 * The image field is left empty: uploading a new file replaces the photo,
 * leaving it blank keeps the existing one. We show the current image so
 * it's clear what's already there.
 */
export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) notFound();

  const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
  if (!item) notFound();

  // Bind the id so the form action has the (id, formData) shape.
  const updateWithId = updateItem.bind(null, itemId);
  const deleteWithId = deleteItem.bind(null, itemId);

  const field: React.CSSProperties = {
    width: "100%",
    padding: "0.55rem",
    marginTop: "0.25rem",
    border: "1px solid #ccc",
    borderRadius: 6,
    boxSizing: "border-box",
  };
  const label: React.CSSProperties = {
    display: "block",
    marginTop: "1rem",
    fontSize: 14,
    fontWeight: 600,
  };

  // Pence → pounds string for the number inputs' default values.
  const toPounds = (pence: number) => (pence / 100).toFixed(2);

  return (
    <main style={{ maxWidth: 520, margin: "3rem auto", padding: "0 1rem" }}>
      <Link href={`/inventory/${item.id}`} style={{ fontSize: 14 }}>
        ← Back to item
      </Link>
      <h1>Edit item</h1>

      <form action={updateWithId}>
        <label style={label}>
          Description
          <textarea
            name="description"
            required
            rows={3}
            defaultValue={item.description}
            style={field}
          />
        </label>

        <label style={label}>
          Ticket price (£)
          <input type="number" name="price" step="0.01" min="0" required
            defaultValue={toPounds(item.pricePence)} style={field} />
        </label>

        <label style={label}>
          Cost (£)
          <input type="number" name="cost" step="0.01" min="0" required
            defaultValue={toPounds(item.costPence)} style={field} />
        </label>

        <label style={label}>
          Condition (optional)
          <textarea name="condition" rows={2}
            defaultValue={item.condition ?? ""} style={field} />
        </label>

        <label style={label}>
          Dimensions (optional)
          <input type="text" name="dimensions"
            defaultValue={item.dimensions ?? ""} style={field} />
        </label>

        <label style={label}>
          Status
          <select name="status" defaultValue={item.status} style={field}>
            <option value="for_sale">For sale</option>
            <option value="sold">Sold</option>
          </select>
        </label>

        <label style={label}>
          Location
          <select name="location" defaultValue={item.location} style={field}>
            <option value="centre_a">Centre A</option>
            <option value="centre_b">Centre B</option>
          </select>
        </label>

        <label style={label}>
          Listing URL (optional)
          <input type="url" name="listingUrl"
            defaultValue={item.listingUrl ?? ""} style={field} />
        </label>

        <label style={label}>
          Replace photo (optional)
          <input type="file" name="image" accept="image/*" style={field} />
        </label>
        {item.imageKey && (
          <p style={{ fontSize: 12, color: "#666", marginTop: "0.25rem" }}>
            Leaving this blank keeps the current photo.
          </p>
        )}

        <button type="submit"
          style={{
            marginTop: "1.5rem", padding: "0.6rem 1.2rem", border: "none",
            borderRadius: 6, background: "#111", color: "#fff", cursor: "pointer",
          }}>
          Save changes
        </button>
      </form>

      {/* Delete — separate form, not nested. */}
      <form
        action={deleteWithId}
        style={{ marginTop: "2.5rem", borderTop: "1px solid #eee", paddingTop: "1.5rem" }}
      >
        <DeleteButton />
        <p style={{ fontSize: 12, color: "#999", marginTop: "0.5rem" }}>
          This permanently removes the item and its photo.
        </p>
      </form>
    </main>
  );
}
