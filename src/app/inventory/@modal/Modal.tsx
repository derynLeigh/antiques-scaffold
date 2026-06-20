"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

/**
 * Modal shell for the intercepted detail view. Closing = router.back(),
 * which pops the intercepted route off history and lets the @modal slot
 * fall back to default.tsx (null) — so the list reappears with its state
 * intact. Closes on backdrop click and Escape.
 *
 * The content inside stays a Server Component (ItemDetail) — only this
 * shell needs to be client-side for the interaction handlers.
 */
export function Modal({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") router.back();
    }
    document.addEventListener("keydown", onKey);
    // Lock background scroll while the modal is open.
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [router]);

  return (
    <div
      ref={overlayRef}
      onClick={(e) => {
        // Only close if the backdrop itself was clicked, not the panel.
        if (e.target === overlayRef.current) router.back();
      }}
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-ink/40 p-4 backdrop-blur-sm sm:p-8"
      role="dialog"
      aria-modal="true"
    >
      <div className="relative my-8 w-full max-w-2xl rounded-2xl border border-line bg-surface p-6 shadow-xl sm:p-8">
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-paper hover:text-ink"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
