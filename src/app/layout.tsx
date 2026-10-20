import type { Metadata, Viewport } from "next";
import { Bodoni_Moda, Jost } from "next/font/google";
import "./globals.css";

const bodoni = Bodoni_Moda({ variable: "--font-bodoni", subsets: ["latin"], display: "swap" });
const jost = Jost({ variable: "--font-jost", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "MG Estudio — Design and Style",
  description: "Reservá tu turno en MG Estudio.",
};

// colorScheme "dark": el navegador pinta su lienzo, scrollbars y controles en oscuro desde el primer cuadro.
export const viewport: Viewport = { themeColor: "#0a0a0a", colorScheme: "dark" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${bodoni.variable} ${jost.variable} h-full bg-cream antialiased`}>
      <body className="flex min-h-full flex-col bg-cream">{children}</body>
    </html>
  );
}
