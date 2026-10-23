import type { Metadata } from "next";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { dictionaryFor } from "@/i18n";
import { I18nProvider } from "@/i18n/client";
import { getT } from "@/i18n/server";
import { env } from "@/shared/env";
import "./compass.css";
import "./globals.css";
import "./modern.css";

export function generateMetadata(): Metadata {
  const { t } = getT();
  return {
    metadataBase: new URL(env.APP_URL),
    title: { default: t("meta.title"), template: "%s · Travel's Affair" },
    description: t("meta.description"),
    openGraph: { siteName: "Travel's Affair", type: "website", title: t("meta.title"), description: t("meta.description"), images: ["/img/hero.jpg"] },
    twitter: { card: "summary_large_image" },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const { lang } = getT();
  const org = { "@context": "https://schema.org", "@type": "TravelAgency", name: "Travel's Affair", url: env.APP_URL, address: { "@type": "PostalAddress", addressLocality: "Yaoundé", addressCountry: "CM" } };
  return (
    <html lang={lang}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(org) }} />
      </head>
      <body>
        <I18nProvider lang={lang} dict={dictionaryFor(lang)}>
          <Header />
          {children}
          <Footer />
        </I18nProvider>
      </body>
    </html>
  );
}
