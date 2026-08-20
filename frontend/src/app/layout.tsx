import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Gastronomía | Gestión de inventario",
  description:
    "Sistema de gestión de inventario, préstamos y trazabilidad para Gastronomía.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
