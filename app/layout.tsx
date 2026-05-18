import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FirmaCheck – Ověření české firmy",
  description: "Vyhledejte informace o české firmě podle IČO z registru ARES",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="cs" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
