"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/cn";

export type NavigationItem = {
  href: string;
  label: string;
  icon?: ReactNode;
  roles?: string[];
};

export function AppShell({
  children,
  identity,
  navigation,
  onLogout,
  productName = "Gastronomía",
  productSubtitle = "Laboratorio e Inventario",
}: {
  children: ReactNode;
  identity?: ReactNode;
  navigation: NavigationItem[];
  onLogout?: () => void;
  productName?: string;
  productSubtitle?: string;
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname() ?? "";
  const nav = <Navigation pathname={pathname} items={navigation} onNavigate={() => setIsMenuOpen(false)} />;

  return (
    <div className="min-h-screen bg-gastro-surface-low text-gastro-primary lg:grid lg:grid-cols-[17.5rem_1fr]">
      <aside className="hidden min-h-screen flex-col bg-gastro-primary text-white lg:flex">
        <Brand name={productName} subtitle={productSubtitle} />
        {nav}
        {onLogout ? <button className="mt-auto border-t border-white/15 px-5 py-4 text-left text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white" onClick={onLogout} type="button">Cerrar sesión</button> : null}
      </aside>
      {isMenuOpen ? <div className="fixed inset-0 z-40 bg-gastro-primary/40 lg:hidden" onClick={() => setIsMenuOpen(false)} /> : null}
      <aside aria-label="Navegación" className={cn("fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gastro-primary text-white transition-transform lg:hidden", isMenuOpen ? "translate-x-0" : "-translate-x-full")}>
        <div className="flex items-start justify-between"><Brand name={productName} subtitle={productSubtitle} /><button aria-label="Cerrar menú" className="m-4 rounded p-2 text-white hover:bg-white/10" onClick={() => setIsMenuOpen(false)} type="button">×</button></div>
        {nav}
        {onLogout ? <button className="mt-auto border-t border-white/15 px-5 py-4 text-left text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white" onClick={onLogout} type="button">Cerrar sesión</button> : null}
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center justify-between border-b border-gastro-outline-variant bg-white px-4 sm:px-8">
          <button aria-label="Abrir menú" className="rounded p-2 text-gastro-primary hover:bg-gastro-surface-low lg:hidden" onClick={() => setIsMenuOpen(true)} type="button">☰</button>
          <p className="hidden text-sm text-gastro-muted sm:block">Gestión operativa del laboratorio</p>
          <div className="ml-auto">{identity}</div>
        </header>
        <main className="mx-auto w-full max-w-[100rem] p-4 sm:p-8">{children}</main>
      </div>
    </div>
  );
}

function Brand({ name, subtitle }: { name: string; subtitle: string }) {
  return <div className="px-5 py-7"><p className="text-2xl font-bold tracking-tight">{name}</p><p className="mt-1 text-sm text-white/60">{subtitle}</p></div>;
}

function Navigation({ items, onNavigate, pathname }: { items: NavigationItem[]; onNavigate: () => void; pathname: string }) {
  return <nav className="flex flex-col gap-1 px-2" aria-label="Navegación principal">{items.map((item) => {
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
    return <Link className={cn("flex items-center gap-3 border-l-4 border-transparent px-3 py-3 text-sm font-semibold text-white/65 transition-colors hover:bg-white/10 hover:text-white", active && "border-gastro-action bg-white/10 text-white")} href={item.href} key={item.href} onClick={onNavigate}>{item.icon ? <span aria-hidden="true">{item.icon}</span> : null}{item.label}</Link>;
  })}</nav>;
}
