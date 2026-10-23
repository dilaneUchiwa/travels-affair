import type { Metadata } from "next";
import { AdminProviders } from "@/components/admin/AdminProviders";
import "./admin.css";

export const metadata: Metadata = {
  title: { default: "Administration", template: "%s · Administration Travel's Affair" },
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body>
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}
