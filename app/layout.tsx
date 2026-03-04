import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maru Wishlist",
  description: "Mobile-first restaurant wishlist for Google Maps and OpenRice shares.",
};

const themeScript = `
(() => {
  const key = "maru-theme";
  const saved = localStorage.getItem(key);
  const mode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  const resolved = mode === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : mode;
  document.documentElement.classList.toggle("dark", resolved === "dark");
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f3f7ff_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_58%,#111827_100%)] dark:text-slate-50">
        {children}
      </body>
    </html>
  );
}
