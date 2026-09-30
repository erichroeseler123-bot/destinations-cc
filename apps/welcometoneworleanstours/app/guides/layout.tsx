import type { ReactNode } from "react";

export default function GuidesLayout({ children }: { children: ReactNode }) {
  return <>{children}<aside style={{ padding: "20px 24px", background: "#faf7ef", color: "#241e18", textAlign: "center", fontSize: 14 }}>Published by Welcome to New Orleans Tours · <a href="/editorial-policy" style={{ color: "#563078", textDecoration: "underline" }}>Editorial policy</a></aside></>;
}
