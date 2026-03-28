import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SonnerToaster } from "@/components/sonner-toaster";
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
      <body className="text-slate-950 dark:text-slate-500 bg-[#f8fbff] dark:bg-[#020617]">
        {children}
        <SonnerToaster />
        <Analytics />
      </body>
    </html>
  );
}
