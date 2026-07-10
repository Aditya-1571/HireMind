import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HireMind",
  description: "AI interview platform for structured hiring workflows.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
