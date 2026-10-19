import { useId, type InputHTMLAttributes } from "react";
export default function Input({
  label,
  error,
  hint,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
}) {
  const generated = useId();
  const fieldId = id ?? generated;
  return (
    <div className="field">
      <label htmlFor={fieldId}>
        {label}
        {props.required && <span aria-hidden="true"> *</span>}
      </label>
      <input
        id={fieldId}
        className="control"
        aria-invalid={!!error}
        aria-describedby={error || hint ? `${fieldId}-help` : undefined}
        {...props}
      />
      {(error || hint) && (
        <p
          id={`${fieldId}-help`}
          className={error ? "field-error" : "field-hint"}
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
