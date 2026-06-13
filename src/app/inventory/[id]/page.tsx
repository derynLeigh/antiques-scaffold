import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items } from "@/db/schema";
import { publicUrl } from "@/lib/r2";
import {
  formatPrice,
  statusLabel,
  locationLabel,
  formatDate,
} from "@/lib/format";

/**
 * Item detail view at /inventory/[id].
 *
 * In Next 16, route params are async — params is a Promise that must be
 * awaited before use. (This changed from the older sync params; getting
 * it wrong is a common Next 15/16 migration gotcha.)
 *
 * We parse the id to an integer and 404 on anything invalid or missing,
 * rather than letting a bad query throw — notFound() renders the proper
 * Next not-found page.
 */
export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const itemId = Number(id);
  if (!Number.isInteger(itemId)) notFound();

  const [item] = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1);

  if (!item) notFound();

  return (
    <main style={{ maxWidth: 720, margin: "3rem auto", padding: "0 1rem" }}>
      <Link href="/inventory" style={{ fontSize: 14 }}>
        ← Back to inventory
      </Link>

      <h1 style={{ marginTop: "1rem" }}>{item.description}</h1>

      {item.imageKey && (
        <div style={{ margin: "1rem 0" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={publicUrl(item.imageKey)}
            alt={item.description}
            style={{
              maxWidth: "100%",
              borderRadius: 8,
              border: "1px solid #e5e5e5",
            }}
          />
        </div>
      )}

      <dl
        style={{
          display: "grid",
          gridTemplateColumns: "max-content 1fr",
          gap: "0.5rem 1.5rem",
          fontSize: 15,
        }}
      >
        <dt style={{ color: "#666" }}>Price</dt>
        <dd style={{ margin: 0 }}>{formatPrice(item.pricePence)}</dd>

        <dt style={{ color: "#666" }}>Status</dt>
        <dd style={{ margin: 0 }}>{statusLabel(item.status)}</dd>

        <dt style={{ color: "#666" }}>Location</dt>
        <dd style={{ margin: 0 }}>{locationLabel(item.location)}</dd>

        <dt style={{ color: "#666" }}>Added</dt>
        <dd style={{ margin: 0 }}>{formatDate(item.createdAt)}</dd>

        {item.soldAt && (
          <>
            <dt style={{ color: "#666" }}>Sold</dt>
            <dd style={{ margin: 0 }}>{formatDate(item.soldAt)}</dd>
          </>
        )}

        {item.listingUrl && (
          <>
            <dt style={{ color: "#666" }}>Listing</dt>
            <dd style={{ margin: 0 }}>
              <a
                href={item.listingUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                View online listing ↗
              </a>
            </dd>
          </>
        )}
      </dl>

      <div style={{ marginTop: "2rem" }}>
        <Link
          href={`/inventory/${item.id}/edit`}
          style={{
            padding: "0.5rem 1rem",
            border: "1px solid #111",
            borderRadius: 6,
            textDecoration: "none",
            color: "#111",
            fontSize: 14,
          }}
        >
          Edit item
        </Link>
      </div>
    </main>
  );
}
