import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { QueryProvider } from '@/providers/QueryProvider';
import "./globals.css";

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Gastronomía | Gestión de inventario",
  description:
    "Sistema de gestión de inventario, préstamos y trazabilidad para Gastronomía.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
