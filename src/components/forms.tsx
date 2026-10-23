"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useT } from "@/i18n/client";
import type { FormState } from "@/shared/action";

export function SubmitButton({ children, className = "btn" }: { children: React.ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  const { t } = useT();
  return (
    <button className={className} disabled={pending} type="submit">
      {pending ? t("common.wait") : children}
    </button>
  );
}

/** Formulaire branché sur une Server Action avec affichage de l'erreur renvoyée. */
export function ActionForm({
  action,
  children,
  className,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useFormState(action, undefined);
  useEffect(() => {
    if (state?.redirectTo) window.location.assign(state.redirectTo);
  }, [state]);
  return (
    <form action={formAction} className={className}>
      {state?.error && (
        <p className="alert error" role="alert">
          {state.error}
        </p>
      )}
      {children}
    </form>
  );
}
