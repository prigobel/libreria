import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Libreria - Cataloga i tuoi libri",
  description: "App per catalogare la tua libreria personale con riconoscimento automatico",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Libreria",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
