"use client";

import { useEffect, useState } from "react";

/**
 * Dark-mode toggle. Flips the `.dark` class on <html> and remembers the
 * choice in localStorage so it persists across visits.
 *
 * The flash-of-wrong-theme problem: if we only set the theme in useEffect
 * (after hydration), the page paints in light mode first, then snaps to
 * dark — an ugly flicker. We prevent it with the inline script in
 * layout.tsx that runs BEFORE React, setting the class from localStorage
 * up front. This component then just reads the already-applied state and
 * handles toggling.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(false);

  // On mount, read the class the inline script already set.
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggle() {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("theme", next ? "dark" : "light");
    } catch {
      // localStorage unavailable (private mode etc.) — toggle still works
      // for the session, just won't persist.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className="rounded-lg border border-line-strong bg-surface px-3 py-2 text-sm text-muted transition-colors hover:bg-paper"
    >
      {isDark ? "☀ Light" : "☾ Dark"}
    </button>
  );
}
