import Link from "next/link";

/**
 * Filter bar — a GET form. Submitting navigates to /inventory with the
 * fields as query params (?q=…&minPrice=…), which the page reads and
 * applies. Using method="get" (not a server action) is deliberate: it
 * makes filters live in the URL, so they're shareable, bookmarkable, and
 * survive a refresh — and it needs zero client JS.
 *
 * defaultValue echoes the current filters back so the form stays
 * populated after submitting. A "Clear" link resets by linking to the
 * bare /inventory path.
 */
export function FilterBar({
  current,
}: {
  current: {
    q?: string;
    minPrice?: string;
    maxPrice?: string;
    from?: string;
    to?: string;
  };
}) {
  const field: React.CSSProperties = {
    padding: "0.45rem",
    border: "1px solid #ccc",
    borderRadius: 6,
    fontSize: 14,
  };
  const labelStyle: React.CSSProperties = {
    display: "flex",
    flexDirection: "column",
    gap: "0.2rem",
    fontSize: 12,
    color: "#666",
  };

  const hasFilters =
    current.q || current.minPrice || current.maxPrice || current.from || current.to;

  return (
    <form
      method="get"
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "0.75rem",
        alignItems: "flex-end",
        padding: "1rem",
        background: "#fafafa",
        border: "1px solid #eee",
        borderRadius: 8,
        marginBottom: "1.5rem",
      }}
    >
      <label style={{ ...labelStyle, flex: "1 1 200px" }}>
        Keyword
        <input
          type="text"
          name="q"
          defaultValue={current.q ?? ""}
          placeholder="description or condition"
          style={field}
        />
      </label>

      <label style={labelStyle}>
        Min £
        <input
          type="number"
          name="minPrice"
          step="0.01"
          min="0"
          defaultValue={current.minPrice ?? ""}
          style={{ ...field, width: 90 }}
        />
      </label>

      <label style={labelStyle}>
        Max £
        <input
          type="number"
          name="maxPrice"
          step="0.01"
          min="0"
          defaultValue={current.maxPrice ?? ""}
          style={{ ...field, width: 90 }}
        />
      </label>

      <label style={labelStyle}>
        Added from
        <input
          type="date"
          name="from"
          defaultValue={current.from ?? ""}
          style={field}
        />
      </label>

      <label style={labelStyle}>
        Added to
        <input
          type="date"
          name="to"
          defaultValue={current.to ?? ""}
          style={field}
        />
      </label>

      <button
        type="submit"
        style={{
          padding: "0.5rem 1rem",
          background: "#111",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 14,
        }}
      >
        Filter
      </button>

      {hasFilters && (
        <Link
          href="/inventory"
          style={{ fontSize: 13, color: "#666", alignSelf: "center" }}
        >
          Clear
        </Link>
      )}
    </form>
  );
}
