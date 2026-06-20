import "./globals.css";

export const metadata = {
  title: "Antiques Inventory",
  description: "Stock inventory for the antiques business",
};

/**
 * The inline script in <head> runs before React hydrates, reading the
 * saved theme from localStorage and applying the `.dark` class immediately.
 * This prevents the flash-of-wrong-theme: the page paints in the correct
 * theme from the very first frame rather than flipping after hydration.
 * suppressHydrationWarning tells React not to complain that the class on
 * <html> differs between server render (no class) and client (class set).
 */
const themeScript = `
  try {
    var t = localStorage.getItem('theme');
    if (t === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
