import { useId } from "react";

/** Étoiles de notation en SVG (dégradé doré, demi-étoiles supportées). */
export function Stars({ value, max = 5, size = 16, label }: { value: number; max?: number; size?: number; label?: string }) {
  const uid = useId().replace(/:/g, "");
  const path = "M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z";
  return (
    <span className="stars-svg" role="img" aria-label={label ?? `${value}/${max}`} style={{ display: "inline-flex", gap: 2, verticalAlign: "middle" }}>
      <svg width="0" height="0" aria-hidden="true" style={{ position: "absolute" }}>
        <defs>
          <linearGradient id={`g${uid}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#ffd45c" /><stop offset="1" stopColor="#f2a400" /></linearGradient>
        </defs>
      </svg>
      {Array.from({ length: max }, (_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24" aria-hidden="true">
            <defs>
              <clipPath id={`c${uid}${i}`}><rect x="0" y="0" width={24 * fill} height="24" /></clipPath>
            </defs>
            <path d={path} fill="#e5e9f0" />
            {fill > 0 && <path d={path} fill={`url(#g${uid})`} clipPath={`url(#c${uid}${i})`} stroke="#e39a00" strokeWidth=".6" strokeLinejoin="round" />}
          </svg>
        );
      })}
    </span>
  );
}
