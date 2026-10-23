"use client";

import { useFormState, useFormStatus } from "react-dom";
import type { FormState } from "@/shared/action";
import { btnPrimary } from "./ui";

export function AdminSubmit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className={btnPrimary}>
      {pending ? "Patientez…" : children}
    </button>
  );
}

export function AdminActionForm({
  action,
  children,
  className,
}: {
  action: (state: FormState, fd: FormData) => Promise<FormState>;
  children: React.ReactNode;
  className?: string;
}) {
  const [state, formAction] = useFormState(action, undefined);
  return (
    <form action={formAction} className={className}>
      {state?.error && (
        <p role="alert" className="mb-5 rounded-lg border border-error-500 bg-error-50 p-4 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/15 dark:text-error-500">
          {state.error}
        </p>
      )}
      {children}
    </form>
  );
}
