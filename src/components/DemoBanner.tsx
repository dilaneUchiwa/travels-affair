export function DemoBanner() {
  if (process.env.NEXT_PUBLIC_DEMO !== "1") return null;
  return (
    <div className="demo-banner" role="status">
      Démo — paiements simulés · aucun billet émis · données d&apos;exemple
    </div>
  );
}
