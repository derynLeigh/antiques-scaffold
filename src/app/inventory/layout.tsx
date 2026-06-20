/**
 * Inventory layout — hosts the @modal parallel slot. `children` is the
 * normal page (list, new, detail-as-full-page); `modal` is the slot that
 * the intercepting route (@modal/(.)[id]) fills when you click an item
 * from the list. On direct visit/refresh the slot falls back to its
 * default.tsx (null), so no modal — you get the full page instead.
 */
export default function InventoryLayout({
  children,
  modal,
}: {
  children: React.ReactNode;
  modal: React.ReactNode;
}) {
  return (
    <>
      {children}
      {modal}
    </>
  );
}
