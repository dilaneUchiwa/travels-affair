/** Logo de la compagnie (ou monogramme si aucun logo n'est téléversé). */
export function AirlineBadge({ name, logo, size = 36 }: { name: string; logo?: string | null; size?: number }) {
  const initials = name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
  return (
    <span className="airline-badge" style={{ width: size, height: size }} title={name}>
      {logo ? /* eslint-disable-next-line @next/next/no-img-element */ <img src={logo} alt={name} /> : <b>{initials}</b>}
    </span>
  );
}
