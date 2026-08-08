"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Search,
  Bell,
  Moon,
  Sun,
  Menu,
  ChevronDown,
  LogOut,
} from "lucide-react";
import { NAV } from "./nav";
import { Logo } from "./Logo";

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  const toggle = () => {
    const el = document.documentElement;
    const next = !el.classList.contains("dark");
    el.classList.toggle("dark", next);
    try {
      localStorage.setItem("sp-theme", next ? "dark" : "light");
    } catch {}
    setDark(next);
  };
  return { dark, toggle };
}

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { dark, toggle } = useTheme();
  const [open, setOpen] = useState(true); // desktop sidebar
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-surface border-r border-border flex flex-col transition-transform
          ${open ? "md:translate-x-0" : "md:-translate-x-64"}
          ${mobileOpen ? "translate-x-0" : "-translate-x-64 md:translate-x-0"}`}
      >
        <div className="h-16 flex items-center px-5 border-b border-border">
          <Link href="/admin">
            <Logo />
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <div className="px-3 pb-2 text-[11px] font-semibold tracking-widest text-muted">
            CONTENT
          </div>
          <ul className="space-y-1">
            {NAV.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              const showChildren = item.children && active;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors
                      ${
                        active
                          ? "bg-accent/10 text-accent"
                          : "text-foreground/80 hover:bg-foreground/5"
                      }`}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                    <span className="flex-1">{item.label}</span>
                    {item.children && (
                      <ChevronDown
                        className={`h-4 w-4 transition-transform ${
                          showChildren ? "rotate-180" : ""
                        }`}
                      />
                    )}
                  </Link>
                  {showChildren && (
                    <ul className="mt-1 ml-4 space-y-1 border-l border-border pl-3">
                      {item.children!.map((child) => {
                        const cActive = pathname === child.href;
                        return (
                          <li key={child.href}>
                            <Link
                              href={child.href}
                              onClick={() => setMobileOpen(false)}
                              className={`block rounded-lg px-3 py-2 text-sm transition-colors
                                ${
                                  cActive
                                    ? "bg-accent/10 text-accent font-medium"
                                    : "text-foreground/70 hover:bg-foreground/5"
                                }`}
                            >
                              {child.label}
                            </Link>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="p-4 border-t border-border text-[11px] text-muted">
          © 2026 SP News Media
        </div>
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Main column */}
      <div className={`transition-[padding] ${open ? "md:pl-64" : "md:pl-0"}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-20 h-16 bg-surface/90 backdrop-blur border-b border-border flex items-center gap-3 px-4">
          <button
            aria-label="Toggle sidebar"
            onClick={() => {
              setOpen((v) => !v);
              setMobileOpen((v) => !v);
            }}
            className="grid place-items-center h-10 w-10 rounded-lg border border-border hover:bg-foreground/5"
          >
            <Menu className="h-5 w-5" />
          </button>

          <div className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
              <input
                placeholder="Search or type command…"
                className="w-full h-10 rounded-lg bg-background border border-border pl-10 pr-16 text-sm outline-none focus:ring-2 focus:ring-accent/40"
              />
              <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-muted border border-border rounded px-1.5 py-0.5">
                ⌘K
              </kbd>
            </div>
          </div>

          <button
            aria-label="Toggle theme"
            onClick={toggle}
            className="grid place-items-center h-10 w-10 rounded-full border border-border hover:bg-foreground/5"
          >
            {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button
            aria-label="Notifications"
            className="relative grid place-items-center h-10 w-10 rounded-full border border-border hover:bg-foreground/5"
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-500" />
          </button>

          <div className="flex items-center gap-2 pl-1">
            <div className="grid place-items-center h-9 w-9 rounded-full bg-accent text-white text-sm font-semibold">
              SP
            </div>
            <span className="hidden sm:block text-sm font-medium">Sanjay</span>
            <ChevronDown className="hidden sm:block h-4 w-4 text-muted" />
          </div>
          <button
            aria-label="Sign out"
            title="Sign out"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
            className="grid place-items-center h-10 w-10 rounded-full border border-border hover:bg-foreground/5"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </header>

        <main className="p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
