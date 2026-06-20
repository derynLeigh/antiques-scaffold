import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { ItemDetail } from "../../[id]/ItemDetail";
import { Modal } from "../Modal";

/**
 * Intercepting route: when an item is clicked from the inventory list
 * (soft, same-level navigation), this renders INSTEAD of the full page,
 * showing the detail inside a Modal over the list. The URL still becomes
 * /inventory/[id], so it's shareable — but a direct visit/refresh hits
 * the real page.tsx, not this.
 *
 * ItemDetail is the SAME component the full page uses, so the modal and
 * page never diverge. Only the wrapper differs.
 */
export default async function InterceptedItemModal({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) notFound();
  const [item] = await db.select().from(items).where(eq(items.id, itemId)).limit(1);
  if (!item) notFound();

  return (
    <Modal>
      <ItemDetail item={item} />
    </Modal>
  );
}
