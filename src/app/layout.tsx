import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Slotbook",
  description: "Book time across time zones.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans min-h-screen">{children}</body>
    </html>
  );
}
