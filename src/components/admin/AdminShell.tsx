"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdmin } from "./AdminProviders";

type Props = { user: { name: string; email: string }; children: React.ReactNode };

const icon = (d: string) => (
  <svg className="size-6" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d={d} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const dot = icon("M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z");
type NavItem = { href: string; label: string; exact?: boolean; icon: React.ReactNode };
const NAV: { title: string; items: NavItem[] }[] = [
  {
    title: "Pilotage",
    items: [
      { href: "/admin", label: "Tableau de bord", exact: true, icon: icon("M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z") },
      { href: "/admin/reservations", label: "Réservations", icon: icon("M4 7h16v4a2 2 0 0 0 0 4v4H4v-4a2 2 0 0 0 0-4zM9 7v12") },
      { href: "/admin/paiements", label: "Paiements", icon: icon("M3 7h18v10H3zM3 11h18M7 15h4") },
      { href: "/admin/utilisateurs", label: "Utilisateurs", icon: icon("M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM17 11a3 3 0 1 0-1.5-5.6") },
      { href: "/admin/emails", label: "E-mails envoyés", icon: icon("M3 6h18v12H3zM3 7l9 6 9-6") },
    ],
  },
  {
    title: "Offres",
    items: [
      { href: "/admin/vols", label: "Vols", icon: icon("M2.5 13.5 21 4l-4 16-5.5-5.5-3 4v-5.5z") },
      { href: "/admin/hotels", label: "Hébergements", icon: icon("M3 20V8l9-5 9 5v12M9 20v-6h6v6") },
      { href: "/admin/biens", label: "Biens (chambres)", icon: icon("M3 18v-6h18v6M5 12V7h14v5M3 20v-2M21 20v-2") },
      { href: "/admin/transports", label: "Transports", icon: icon("M5 16h14V6H5zM5 12h14M8 19v-3M16 19v-3") },
      { href: "/admin/vehicules", label: "Locations de véhicules", icon: icon("M5 16l1.5-5h11L19 16M5 16h14v3H5zM7 19v1M17 19v1") },
      { href: "/admin/activites", label: "Activités", icon: icon("M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z") },
    ],
  },
  {
    title: "Référentiels",
    items: [
      { href: "/admin/compagnies", label: "Compagnies aériennes", icon: dot },
      { href: "/admin/prestataires", label: "Prestataires transport", icon: dot },
      { href: "/admin/marques", label: "Marques", icon: dot },
      { href: "/admin/modeles", label: "Modèles", icon: dot },
      { href: "/admin/categories", label: "Catégories véhicules", icon: dot },
    ],
  },
  {
    title: "Système",
    items: [
      { href: "/admin/configuration", label: "Configuration", icon: icon("M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z") },
    ],
  },
  {
    title: "Contenus",
    items: [
      { href: "/admin/pages", label: "Pages d'information", icon: icon("M6 3h9l4 4v14H6zM14 3v5h5") },
      { href: "/admin/faq", label: "FAQ", icon: icon("M9.5 9a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z") },
      { href: "/admin/messages", label: "Messages de contact", icon: icon("M4 5h16v11H8l-4 4z") },
    ],
  },
];

export function AdminShell({ user, children }: Props) {
  const pathname = usePathname();
  const { expanded, mobileOpen, toggleSidebar, closeMobile, dark, toggleTheme } = useAdmin();
  const wide = expanded || mobileOpen;

  return (
    <div className="min-h-screen bg-gray-50 xl:flex dark:bg-gray-950">
      <aside
        className={`fixed top-0 left-0 z-50 flex h-full flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 ${
          wide ? "w-72.5" : "w-22.5"
        } ${mobileOpen ? "translate-x-0" : "-translate-x-full"} xl:translate-x-0`}
      >
        <div className={`flex py-8 ${wide ? "justify-start" : "xl:justify-center"}`}>
          <Link href="/admin" className="flex items-center gap-3 text-xl font-semibold text-gray-800 dark:text-white/90">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/img/site/logo.jpg" alt="Travel's Affair" width="36" height="36" className="size-9 rounded-lg object-contain bg-white" />
            {wide && <span>Travel&apos;s Affair</span>}
          </Link>
        </div>
        <nav className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto pb-4" aria-label="Administration">
          {NAV.map((group) => (
            <div key={group.title} className="mb-3 flex flex-col gap-1">
              <h2 className={`mb-1 flex text-xs leading-5 text-gray-400 uppercase ${wide ? "" : "xl:justify-center"}`}>{wide ? group.title : "•••"}</h2>
              {group.items.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={closeMobile}
                    title={item.label}
                    aria-current={active ? "page" : undefined}
                    className={`menu-item group ${active ? "menu-item-active" : "menu-item-inactive"} ${wide ? "" : "xl:justify-center"}`}
                  >
                    <span className={active ? "menu-item-icon-active" : "menu-item-icon-inactive"}>{item.icon}</span>
                    {wide && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="pb-6">
          <a href="/" className="menu-item menu-item-inactive group">
            <span className="menu-item-icon-inactive">{icon("M4 12 12 4l8 8M6 10v10h12V10")}</span>
            {wide && <span>Voir le site</span>}
          </a>
        </div>
      </aside>
      {mobileOpen && <div className="fixed inset-0 z-40 bg-gray-900/50 xl:hidden" onClick={closeMobile} aria-hidden="true" />}

      <div className={`flex-1 transition-all duration-300 ease-in-out ${expanded ? "xl:ml-72.5" : "xl:ml-22.5"}`}>
        <header className="sticky top-0 z-40 flex w-full items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 py-3 xl:px-6 dark:border-gray-800 dark:bg-gray-900">
          <button
            type="button"
            onClick={toggleSidebar}
            aria-label="Afficher ou masquer le menu"
            className="flex size-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400"
          >
            <svg width="16" height="12" viewBox="0 0 16 12" fill="none" aria-hidden="true"><path d="M0.58 1c0-.41.33-.75.75-.75h13.34a.75.75 0 0 1 0 1.5H1.33A.75.75 0 0 1 .58 1zm0 10c0-.41.33-.75.75-.75h13.34a.75.75 0 0 1 0 1.5H1.33a.75.75 0 0 1-.75-.75zM1.33 5.25a.75.75 0 0 0 0 1.5H8a.75.75 0 0 0 0-1.5z" fill="currentColor" /></svg>
          </button>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={dark ? "Passer en thème clair" : "Passer en thème sombre"}
              className="flex size-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              {dark ? "☀" : "☾"}
            </button>
            <div className="hidden text-right sm:block">
              <div className="text-theme-sm font-medium text-gray-700 dark:text-gray-400">{user.name}</div>
              <div className="text-theme-xs text-gray-500 dark:text-gray-400">{user.email}</div>
            </div>
            <form action="/api/logout" method="post">
              <button type="submit" className="rounded-lg bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-theme-xs ring-1 ring-gray-300 ring-inset hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700 dark:hover:bg-white/3">
                Déconnexion
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto max-w-(--breakpoint-2xl) p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
