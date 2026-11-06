import type { ReactNode } from "react";
import "./globals.css";

export const metadata = {
  title: "SplitPal AI — split the bill, settle with PayPal",
  description:
    "Paste a receipt, let the splitter assign items and allocate tax/tip proportionally, and let everyone settle their own share with PayPal.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
