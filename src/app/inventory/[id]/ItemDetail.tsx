import Link from "next/link";
import type { Item } from "@/db/schema";
import { publicUrl } from "@/lib/r2";
import { formatPrice, statusLabel, locationLabel, formatDate } from "@/lib/format";

/**
 * The item detail body, shared between the full page (/inventory/[id])
 * and the intercepting-route modal. Keeping it in one component means the
 * modal and the standalone page can never drift apart.
 */
export function ItemDetail({ item }: { item: Item }) {
  const dt = "text-muted";
  const dd = "text-ink";

  return (
    <div>
      <h1 className="text-xl font-semibold tracking-tight text-ink">{item.description}</h1>

      {item.imageKey && (
        <div className="mt-4">
          {item.listingUrl ? (
            <a href={item.listingUrl} target="_blank" rel="noopener noreferrer" title="View this item's online listing">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={publicUrl(item.imageKey)} alt={item.description}
                className="max-h-[60vh] w-full rounded-xl border border-line object-contain" />
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={publicUrl(item.imageKey)} alt={item.description}
              className="max-h-[60vh] w-full rounded-xl border border-line object-contain" />
          )}
        </div>
      )}

      <dl className="mt-5 grid grid-cols-[max-content_1fr] gap-x-6 gap-y-2 text-base">
        <dt className={dt}>Price</dt><dd className={dd}>{formatPrice(item.pricePence)}</dd>
        <dt className={dt}>Cost</dt><dd className={dd}>{formatPrice(item.costPence)}</dd>
        {item.condition && (<><dt className={dt}>Condition</dt><dd className={dd}>{item.condition}</dd></>)}
        {item.dimensions && (<><dt className={dt}>Dimensions</dt><dd className={dd}>{item.dimensions}</dd></>)}
        <dt className={dt}>Status</dt><dd className={dd}>{statusLabel(item.status)}</dd>
        <dt className={dt}>Location</dt><dd className={dd}>{locationLabel(item.location)}</dd>
        <dt className={dt}>Added</dt><dd className={dd}>{formatDate(item.createdAt)}</dd>
        {item.soldAt && (<><dt className={dt}>Sold</dt><dd className={dd}>{formatDate(item.soldAt)}</dd></>)}
        {item.listingUrl && (
          <>
            <dt className={dt}>Listing</dt>
            <dd className={dd}>
              <a href={item.listingUrl} target="_blank" rel="noopener noreferrer"
                className="text-accent underline underline-offset-2">View online listing ↗</a>
            </dd>
          </>
        )}
      </dl>

      <div className="mt-6">
        <Link href={`/inventory/${item.id}/edit`}
          className="rounded-lg border border-line-strong px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper">
          Edit item
        </Link>
      </div>
    </div>
  );
}
