"use client";

/**
 * Client component for the delete submit button, solely so we can attach
 * a confirm() guard — deletion is irreversible (row + R2 objects gone),
 * so a misclick shouldn't silently destroy an item.
 *
 * It's a submit button inside the delete <form> in the parent server
 * component; onClick runs the confirm first and cancels the submit if the
 * user declines. Kept as a minimal client island so the rest of the page
 * stays a server component.
 */
export function DeleteButton() {
  return (
    <button
      type="submit"
      onClick={(e) => {
        if (!confirm("Delete this item permanently? This cannot be undone.")) {
          e.preventDefault();
        }
      }}
      style={{
        padding: "0.5rem 1rem",
        border: "1px solid #c00",
        borderRadius: 6,
        background: "#fff",
        color: "#c00",
        cursor: "pointer",
        fontSize: 14,
      }}
    >
      Delete item
    </button>
  );
}
