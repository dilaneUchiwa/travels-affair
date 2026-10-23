// Partenaires et références repris du site travels-affair.com
const AIRLINES = [
  { src: "/img/partners/ibom-air.png", name: "Ibom Air" },
  { src: "/img/partners/tchadia.png", name: "Tchadia Airlines" },
  { src: "/img/partners/egyptair.png", name: "EgyptAir" },
  { src: "/img/partners/ceiba.png", name: "Ceiba Intercontinental" },
  { src: "/img/partners/kenya-airways.png", name: "Kenya Airways" },
  { src: "/img/partners/rwandair.jpg", name: "RwandAir" },
  { src: "/img/partners/asky.png", name: "ASKY Airlines" },
  { src: "/img/partners/brussels-airlines.png", name: "Brussels Airlines" },
  { src: "/img/partners/afrijet.png", name: "Afrijet" },
  { src: "/img/partners/ethiopian.png", name: "Ethiopian Airlines" },
  { src: "/img/partners/camair-co.png", name: "Camair-Co" },
  { src: "/img/partners/air-cote-divoire.png", name: "Air Côte d'Ivoire" },
  { src: "/img/partners/ram.png", name: "Royal Air Maroc" },
  { src: "/img/partners/turkish-airlines.png", name: "Turkish Airlines" },
  { src: "/img/partners/air-france.png", name: "Air France" },
];

const REFERENCES = ["Projet REDD", "PAEQUE", "UICN", "PADFA", "ICRAF", "IITA", "IFORD", "CENAME", "FEICOM"];

export function Partners({ lang }: { lang: string }) {
  const en = lang === "en";
  return (
    <section className="partners" aria-label={en ? "Our partners" : "Nos partenaires"}>
      <h2>{en ? "Our airline partners" : "Nos compagnies partenaires"}</h2>
      <div className="partners-logos">
        {AIRLINES.map((a) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={a.src} src={a.src} alt={a.name} title={a.name} loading="lazy" />
        ))}
      </div>

      <h3>{en ? "They trust us" : "Ils nous font confiance"}</h3>
      <ul className="partners-refs">
        {REFERENCES.map((r) => (
          <li key={r}>{r}</li>
        ))}
        <li className="muted">{en ? "and hundreds of individuals" : "et des centaines de particuliers"}</li>
      </ul>
    </section>
  );
}
