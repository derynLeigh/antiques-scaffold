import type { Item } from "@/db/schema";

/**
 * Shared form fields for create and edit. Both forms have identical
 * inputs; extracting them means one styling source and no drift between
 * the two. `item` is optional — when present (edit), fields pre-fill from
 * it; when absent (create), they're empty.
 */
export function ItemFormFields({ item }: { item?: Item }) {
  const input =
    "mt-1 w-full rounded-lg border border-line-strong bg-search-bg px-3 py-2.5 text-base text-ink " +
    "placeholder:text-faint focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/40 transition-colors";
  const label = "block mt-4 text-sm font-medium text-ink";
  const toPounds = (pence: number) => (pence / 100).toFixed(2);

  return (
    <>
      <label className={label}>
        Description
        <textarea name="description" required rows={3} defaultValue={item?.description ?? ""} className={input} />
      </label>

      <label className={label}>
        Ticket price (£)
        <input type="number" name="price" step="0.01" min="0" required
          placeholder="42.50"
          defaultValue={item ? toPounds(item.pricePence) : ""} className={input} />
      </label>

      <label className={label}>
        Cost (£)
        <input type="number" name="cost" step="0.01" min="0" required
          placeholder="20.00"
          defaultValue={item ? toPounds(item.costPence) : ""} className={input} />
      </label>

      <label className={label}>
        Condition (optional)
        <textarea name="condition" rows={2} placeholder="e.g. chip to rim, light foxing"
          defaultValue={item?.condition ?? ""} className={input} />
      </label>

      <label className={label}>
        Dimensions (optional)
        <input type="text" name="dimensions" placeholder="e.g. H 42cm × W 30cm"
          defaultValue={item?.dimensions ?? ""} className={input} />
      </label>

      <label className={label}>
        Status
        <select name="status" defaultValue={item?.status ?? "for_sale"} className={input}>
          <option value="for_sale">For sale</option>
          <option value="sold">Sold</option>
        </select>
      </label>

      <label className={label}>
        Location
        <select name="location" defaultValue={item?.location ?? "centre_a"} className={input}>
          <option value="centre_a">Centre A</option>
          <option value="centre_b">Centre B</option>
        </select>
      </label>

      <label className={label}>
        Listing URL (optional)
        <input type="url" name="listingUrl" placeholder="https://..."
          defaultValue={item?.listingUrl ?? ""} className={input} />
      </label>

      <label className={label}>
        {item ? "Replace photo (optional)" : "Photo (optional)"}
        <input type="file" name="image" accept="image/*"
          className="mt-1 block w-full text-sm text-muted file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-2 file:text-sm file:text-white hover:file:bg-accent-hover" />
      </label>
      {item?.imageKey && (
        <p className="mt-1 text-xs text-muted">Leaving this blank keeps the current photo.</p>
      )}
    </>
  );
}
