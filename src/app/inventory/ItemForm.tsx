"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { Item } from "@/db/schema";
import type { FormState } from "./actions";
import { ItemFormFields } from "./ItemFormFields";

/**
 * Client form wrapper for create/edit. useActionState wires the form to a
 * server action that RETURNS { error } on validation failure, so the
 * message renders inline instead of crashing to the error boundary. On
 * success the action redirects, so we never render a success state here.
 *
 * The action prop is the (prevState, formData) => Promise<FormState> server
 * action — for edit it's already bound to the item id by the page.
 */
export function ItemForm({
  action,
  item,
  submitLabel,
}: {
  action: (prev: FormState, formData: FormData) => Promise<FormState>;
  item?: Item;
  submitLabel: string;
}) {
  const [state, formAction] = useActionState<FormState, FormData>(action, {});

  return (
    <form action={formAction} className="mt-2">
      <ItemFormFields item={item} />

      {state?.error && (
        <p
          role="alert"
          className="mt-4 rounded-lg border border-sold-text/40 bg-sold-bg px-4 py-3 text-sm text-sold-text"
        >
          {state.error}
        </p>
      )}

      <SubmitButton label={submitLabel} />
    </form>
  );
}

/**
 * Submit button that disables itself while the action is pending, using
 * useFormStatus (must be a child of the form, hence its own component).
 * Prevents double-submits and gives feedback during image upload.
 */
function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-6 rounded-lg bg-accent px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-hover disabled:opacity-60"
    >
      {pending ? "Saving…" : label}
    </button>
  );
}
