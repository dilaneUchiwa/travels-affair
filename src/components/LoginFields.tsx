"use client";

import { useState } from "react";

type Demo = { label: string; email: string; password: string };

/** Champs de connexion ; en mode démo, préremplis avec un compte par défaut + boutons de bascule. */
export function LoginFields({ demo, labels }: { demo: Demo[]; labels: { email: string; password: string; demo: string } }) {
  const [email, setEmail] = useState(demo[0]?.email ?? "");
  const [password, setPassword] = useState(demo[0]?.password ?? "");
  return (
    <>
      {demo.length > 0 && (
        <div className="demo-accounts" role="group" aria-label={labels.demo}>
          <span>{labels.demo}</span>
          {demo.map((d) => (
            <button type="button" key={d.email} className={email === d.email ? "on" : ""} onClick={() => { setEmail(d.email); setPassword(d.password); }}>
              {d.label}
            </button>
          ))}
        </div>
      )}
      <div className="field"><label htmlFor="email">{labels.email}</label><input id="email" name="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} /></div>
      <div className="field"><label htmlFor="password">{labels.password}</label><input id="password" name="password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} /></div>
    </>
  );
}
