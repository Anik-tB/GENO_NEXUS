import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenoNexus",
  description: "Medication safety intelligence powered by your DNA."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
