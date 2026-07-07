import type { Metadata } from "next";
import "./styles.css";

export const metadata: Metadata = {
  title: "THC: Pheno Quest",
  description: "Vertical playable slice for a cannabis fantasy RPG."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
