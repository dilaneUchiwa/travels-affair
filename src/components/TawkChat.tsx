"use client";

import Script from "next/script";

/**
 * Widget de chat Tawk.to. L'URL d'intégration (https://embed.tawk.to/<propertyId>/<widgetId>)
 * se renseigne dans NEXT_PUBLIC_TAWK_SRC. Sans cette variable, rien n'est chargé.
 */
export function TawkChat() {
  const src = process.env.NEXT_PUBLIC_TAWK_SRC;
  if (!src) return null;
  return (
    <Script id="tawk-to" strategy="afterInteractive">
      {`var Tawk_API=Tawk_API||{},Tawk_LoadStart=new Date();
(function(){var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;s1.src=${JSON.stringify(src)};s1.charset="UTF-8";s1.setAttribute("crossorigin","*");
s0.parentNode.insertBefore(s1,s0);})();`}
    </Script>
  );
}
