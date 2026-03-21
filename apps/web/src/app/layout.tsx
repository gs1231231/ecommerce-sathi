import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "eCommerce Sathi",
  description: "AI-first, India-native e-commerce platform builder",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
