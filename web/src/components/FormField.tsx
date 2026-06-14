import { useId, type ReactNode } from 'react';

interface FormFieldProps {
  label: string;
  children: (props: { id: string; 'aria-invalid': boolean; 'aria-describedby'?: string }) => ReactNode;
  error?: string;
  hint?: string;
  /** Campo privado: mostra cadeado + microcópia (variante PrivacyField). */
  privado?: boolean;
}

/**
 * Campo de formulário padrão: label + controle + erro + hint, com a11y
 * (aria-invalid / aria-describedby). Base de todos os formulários (perfil, proposta).
 */
export function FormField({ label, children, error, hint, privado }: FormFieldProps) {
  const id = useId();
  const descId = error ? `${id}-err` : hint ? `${id}-hint` : undefined;

  return (
    <div className="mb-4">
      <label htmlFor={id} className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-slate-700">
        {label}
        {privado && (
          <span className="inline-flex items-center gap-1 text-xs font-normal text-slate-400">
            🔒 privado
          </span>
        )}
      </label>

      {children({ id, 'aria-invalid': !!error, 'aria-describedby': descId })}

      {error ? (
        <p id={`${id}-err`} className="mt-1 text-xs text-erro">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1 text-xs text-slate-400">
          {hint}
        </p>
      ) : null}

      {privado && !error && !hint && (
        <p className="mt-1 text-xs text-slate-400">
          Visível apenas para você e a plataforma — nunca compartilhado.
        </p>
      )}
    </div>
  );
}

/** Variante de FormField para dados pessoais privados (cadeado + microcópia). */
export function PrivacyField(props: Omit<FormFieldProps, 'privado'>) {
  return <FormField {...props} privado />;
}
