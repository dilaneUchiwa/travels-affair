"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Ctx = {
  dark: boolean;
  toggleTheme: () => void;
  expanded: boolean;
  mobileOpen: boolean;
  toggleSidebar: () => void;
  closeMobile: () => void;
};
const AdminContext = createContext<Ctx | null>(null);

export function useAdmin() {
  const ctx = useContext(AdminContext);
  if (!ctx) throw new Error("useAdmin doit être utilisé dans <AdminProviders>.");
  return ctx;
}

/** Thème clair/sombre (mémorisé) et état de la barre latérale, comme dans TailAdmin. */
export function AdminProviders({ children }: { children: React.ReactNode }) {
  const [dark, setDark] = useState(false);
  const [expanded, setExpanded] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    try {
      setDark(localStorage.getItem("ta-admin-theme") === "dark");
    } catch {}
  }, []);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    try {
      localStorage.setItem("ta-admin-theme", dark ? "dark" : "light");
    } catch {}
  }, [dark]);

  const toggleTheme = useCallback(() => setDark((d) => !d), []);
  const toggleSidebar = useCallback(() => {
    if (window.innerWidth >= 1280) setExpanded((e) => !e);
    else setMobileOpen((o) => !o);
  }, []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  return (
    <AdminContext.Provider value={{ dark, toggleTheme, expanded, mobileOpen, toggleSidebar, closeMobile }}>
      {children}
    </AdminContext.Provider>
  );
}
