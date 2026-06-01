import type { Metadata } from "next";
import ClientResults from "./ClientResults";

export const metadata: Metadata = {
  title: "My DNA Results — GenoNexus",
  description:
    "View your personal genetic health risk assessment results in plain, easy-to-understand language.",
};

export default function ResultsPage() {
  return <ClientResults />;
}
