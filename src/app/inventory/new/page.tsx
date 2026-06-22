import Link from "next/link";
import { createItem } from "../actions";
import { ItemForm } from "../ItemForm";

export default function NewItemPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Link href="/inventory" className="text-sm text-accent underline underline-offset-2">
        ← Back to inventory
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Add item</h1>
      <ItemForm action={createItem} submitLabel="Save item" />
    </main>
  );
}
