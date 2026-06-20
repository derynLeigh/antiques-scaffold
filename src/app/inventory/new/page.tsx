import Link from "next/link";
import { createItem } from "../actions";
import { ItemFormFields } from "../ItemFormFields";

export default function NewItemPage() {
  return (
    <main className="mx-auto max-w-xl px-5 py-12">
      <Link href="/inventory" className="text-sm text-accent underline underline-offset-2">
        ← Back to inventory
      </Link>
      <h1 className="mt-4 text-2xl font-semibold tracking-tight text-ink">Add item</h1>
      <form action={createItem} className="mt-2">
        <ItemFormFields />
        <button
          type="submit"
          className="mt-6 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
        >
          Save item
        </button>
      </form>
    </main>
  );
}
