export default function FormField({
  label,
  htmlFor,
  error,
  helper,
  required,
  children,
  className = '',
}) {
  return (
    <div className={className}>
      {label && (
        <label htmlFor={htmlFor} className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-rose-500 ml-0.5">*</span>}
        </label>
      )}
      {children}
      {helper && !error && <p className="text-caption mt-1">{helper}</p>}
      {error && <p className="text-xs text-rose-600 mt-1" role="alert">{error}</p>}
    </div>
  );
}
