"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

/**
 * Success toast driven by the ?saved= URL param. The server action
 * redirects to /inventory?saved=updated (or =added); this reads that,
 * shows a brief confirmation, then auto-dismisses AND strips the param
 * from the URL so a refresh doesn't replay the toast.
 *
 * URL-as-signal keeps this consistent with the rest of the app (filters,
 * pagination): no toast library, no global state — the redirect carries
 * the message, this component consumes and clears it.
 */
const MESSAGES: Record<string, string> = {
  added: "Item added",
  updated: "Changes saved",
};

export function Toast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const saved = searchParams.get("saved");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!saved || !MESSAGES[saved]) return;

    setVisible(true);

    // Stay visible for 3s, then fade. Strip the param shortly after the
    // fade so the exit transition can play before the URL changes.
    const fadeTimer = setTimeout(() => setVisible(false), 3000);
    const clearTimer = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("saved");
      const qs = params.toString();
      // replace (not push) so the toast URL doesn't litter history.
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }, 3400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(clearTimer);
    };
  }, [saved, searchParams, router, pathname]);

  if (!saved || !MESSAGES[saved]) return null;

  return (
    <div
      aria-live="polite"
      className={`fixed top-12 left-1/2 z-50 -translate-x-1/2 rounded-xl border border-line bg-surface px-10 py-6 text-2xl font-medium text-ink shadow-xl transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      <span className="mr-1 text-sale-text">✓</span> {MESSAGES[saved]}
    </div>
  );
}
