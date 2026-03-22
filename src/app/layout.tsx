import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "GenoNexus | Precision Genomics Intelligence",
  description:
    "GenoNexus is a precision genomics platform for DNA analysis, AI-guided interpretation, visualization, collaboration, and privacy-first clinical decision support."
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
