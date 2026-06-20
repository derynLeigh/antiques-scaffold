"use client";

export function DeleteButton() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm("Delete this item permanently? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
      className="rounded-lg border border-sold-text/50 bg-surface px-4 py-2.5 text-sm font-medium text-sold-text transition-colors hover:bg-sold-bg"
    >
      Delete item
    </button>
  );
}
