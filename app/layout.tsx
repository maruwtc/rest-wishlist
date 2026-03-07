import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Maru Wishlist",
  description: "Mobile-first restaurant wishlist for Google Maps and OpenRice shares.",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Maru Wishlist",
  },
};

export const viewport: Viewport = {
  colorScheme: "light dark",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fbff" },
    { media: "(prefers-color-scheme: dark)", color: "#020617" },
  ],
};

const themeScript = `
(() => {
  const key = "maru-theme";
  const LIGHT_CHROME = "#f8fbff";
  const DARK_CHROME = "#020617";
  const saved = localStorage.getItem(key);
  const mode = saved === "light" || saved === "dark" || saved === "system" ? saved : "system";
  const resolved = mode === "system"
    ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    : mode;
  const isDark = resolved === "dark";
  const color = isDark ? DARK_CHROME : LIGHT_CHROME;
  const root = document.documentElement;
  root.classList.toggle("dark", isDark);
  root.style.backgroundColor = color;
  document.body && (document.body.style.backgroundColor = color);

  const existingThemeMeta = document.querySelector('meta[name="theme-color"]');
  if (existingThemeMeta) {
    existingThemeMeta.setAttribute("content", color);
  } else {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    meta.setAttribute("content", color);
    document.head.appendChild(meta);
  }
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
        <meta name="theme-color" content="#f8fbff" />
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="bg-[radial-gradient(circle_at_top_left,rgba(59,130,246,0.14),transparent_32%),linear-gradient(180deg,#f8fbff_0%,#ffffff_55%,#f3f7ff_100%)] text-slate-950 dark:bg-[radial-gradient(circle_at_top_left,rgba(96,165,250,0.12),transparent_28%),linear-gradient(180deg,#020617_0%,#0f172a_58%,#111827_100%)] dark:text-slate-500">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
