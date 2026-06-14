import { createItem } from "../actions";

/**
 * Create-item form. A plain server-action form: the action runs on the
 * server, does the R2 upload + DB insert, then redirects back to the list.
 *
 * Note we use a real <form> with a server action here (allowed in Next.js
 * Server Components — distinct from the React-Artifact restriction). The
 * enctype is multipart so the image file reaches the action intact.
 *
 * Fields map 1:1 to the schema: description, price (pounds, converted to
 * pennies server-side), status enum, location enum, optional listing URL,
 * optional image.
 */
export default function NewItemPage() {
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

  return (
    <main style={{ maxWidth: 520, margin: "3rem auto", padding: "0 1rem" }}>
      <h1>Add item</h1>
      <form action={createItem} encType="multipart/form-data">
        <label style={label}>
          Description
          <textarea name="description" required rows={3} style={field} />
        </label>

        <label style={label}>
          Ticket price (£)
          <input
            type="number"
            name="price"
            step="0.01"
            min="0"
            required
            placeholder="42.50"
            style={field}
          />
        </label>

        <label style={label}>
          Cost (£)
          <input
            type="number"
            name="cost"
            step="0.01"
            min="0"
            required
            placeholder="20.00"
            style={field}
          />
        </label>

        <label style={label}>
          Condition (optional)
          <textarea
            name="condition"
            rows={2}
            placeholder="e.g. chip to rim, light foxing"
            style={field}
          />
        </label>

        <label style={label}>
          Dimensions (optional)
          <input
            type="text"
            name="dimensions"
            placeholder="e.g. H 42cm × W 30cm"
            style={field}
          />
        </label>

        <label style={label}>
          Status
          <select name="status" defaultValue="for_sale" style={field}>
            <option value="for_sale">For sale</option>
            <option value="sold">Sold</option>
          </select>
        </label>

        <label style={label}>
          Location
          <select name="location" defaultValue="centre_a" style={field}>
            <option value="centre_a">Centre A</option>
            <option value="centre_b">Centre B</option>
          </select>
        </label>

        <label style={label}>
          Listing URL (optional)
          <input
            type="url"
            name="listingUrl"
            placeholder="https://..."
            style={field}
          />
        </label>

        <label style={label}>
          Photo (optional)
          <input type="file" name="image" accept="image/*" style={field} />
        </label>

        <button
          type="submit"
          style={{
            marginTop: "1.5rem",
            padding: "0.6rem 1.2rem",
            border: "none",
            borderRadius: 6,
            background: "#111",
            color: "#fff",
            cursor: "pointer",
          }}
        >
          Save item
        </button>
      </form>
    </main>
  );
}
