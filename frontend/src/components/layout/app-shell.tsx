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
    <div className="min-h-screen bg-gastro-surface-low text-gastro-primary lg:grid lg:grid-cols-[17.5rem_minmax(0,1fr)]">
      <aside className="hidden h-screen flex-col bg-gastro-primary text-white lg:sticky lg:top-0 lg:flex">
        <Brand name={productName} subtitle={productSubtitle} />
        {nav}
        <div className="mt-auto border-t border-white/15">
          {identity ? <div className="px-5 py-4">{identity}</div> : null}
          {onLogout ? <button className="w-full border-t border-white/10 px-5 py-4 text-left text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white" onClick={onLogout} type="button">Cerrar sesión</button> : null}
        </div>
      </aside>
      {isMenuOpen ? <div className="fixed inset-0 z-40 bg-gastro-primary/40 lg:hidden" onClick={() => setIsMenuOpen(false)} /> : null}
      <aside aria-hidden={!isMenuOpen} aria-label="Navegación" className={cn("fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-gastro-primary text-white transition-transform lg:hidden", isMenuOpen ? "translate-x-0" : "-translate-x-full")} inert={!isMenuOpen}>
        <div className="flex items-start justify-between"><Brand name={productName} subtitle={productSubtitle} /><button aria-label="Cerrar menú" className="m-4 rounded p-2 text-white hover:bg-white/10" onClick={() => setIsMenuOpen(false)} type="button">×</button></div>
        {nav}
        <div className="mt-auto border-t border-white/15">
          {identity ? <div className="px-5 py-4">{identity}</div> : null}
          {onLogout ? <button className="w-full border-t border-white/10 px-5 py-4 text-left text-sm font-semibold text-white/75 hover:bg-white/10 hover:text-white" onClick={onLogout} type="button">Cerrar sesión</button> : null}
        </div>
      </aside>
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex min-h-16 items-center border-b border-gastro-outline-variant bg-white/95 px-4 backdrop-blur sm:px-8">
          <button aria-expanded={isMenuOpen} aria-label="Abrir menú" className="rounded p-2 text-gastro-primary hover:bg-gastro-surface-low lg:hidden" onClick={() => setIsMenuOpen(true)} type="button">☰</button>
          <div className="ml-3 lg:ml-0"><p className="text-sm font-semibold text-gastro-primary">Gestión operativa</p><p className="hidden text-xs text-gastro-muted sm:block">Laboratorios, inventario y trazabilidad</p></div>
          <span className="ml-auto rounded-full bg-gastro-success-container px-3 py-1 text-xs font-semibold text-gastro-success">Sistema local</span>
        </header>
        <main className="mx-auto w-full max-w-[100rem] p-4 sm:p-6 xl:p-8">{children}</main>
      </div>
    </div>
  );
}

function Brand({ name, subtitle }: { name: string; subtitle: string }) {
  return <div className="px-5 py-7"><div className="flex items-center gap-3"><span aria-hidden="true" className="grid size-10 place-items-center rounded-xl bg-gastro-action text-xl font-bold text-white">G</span><div><p className="text-xl font-bold tracking-tight">{name}</p><p className="mt-0.5 text-xs text-white/60">{subtitle}</p></div></div></div>;
}

function Navigation({ items, onNavigate, pathname }: { items: NavigationItem[]; onNavigate: () => void; pathname: string }) {
  return <nav className="min-h-0 flex-1 overflow-y-auto px-2" aria-label="Navegación principal"><div className="flex flex-col gap-1 pb-4">{items.map((item) => {
    const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
    return <Link className={cn("flex items-center gap-3 border-l-4 border-transparent px-3 py-3 text-sm font-semibold text-white/65 transition-colors hover:bg-white/10 hover:text-white", active && "border-gastro-action bg-white/10 text-white")} href={item.href} key={item.href} onClick={onNavigate}>{item.icon ? <span aria-hidden="true">{item.icon}</span> : null}{item.label}</Link>;
  })}</div></nav>;
}
