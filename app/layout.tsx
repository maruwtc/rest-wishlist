import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maru Wishlist",
  description: "Mobile-first restaurant wishlist for Google Maps and OpenRice shares.",
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
