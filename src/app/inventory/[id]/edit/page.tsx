import { notFound } from "next/navigation";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { updateItem, deleteItem } from "../../actions";
import { ItemForm } from "../../ItemForm";
import { DeleteButton } from "./DeleteButton";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) notFound();
  const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
  if (!item) notFound();

  const updateWithId = updateItem.bind(null, itemId);
  const deleteWithId = deleteItem.bind(null, itemId);

  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Link href="/inventory" className="text-sm text-accent underline underline-offset-2">
        ← Back to inventory
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Edit item</h1>

      <ItemForm action={updateWithId} item={item} submitLabel="Save changes" />

      <form action={deleteWithId} className="mt-10 border-t border-line pt-6">
        <DeleteButton />
        <p className="mt-2 text-xs text-faint">This permanently removes the item and its photo.</p>
      </form>
    </main>
  );
}
