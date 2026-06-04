import { cn } from '../../utils/cn';
import FormField from './FormField';

export default function Select({
  label,
  error,
  helper,
  required,
  id,
  children,
  className = '',
  fieldClassName = '',
  ...props
}) {
  const selectId = id || props.name;

  const control = (
    <select
      id={selectId}
      className={cn(
        'w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus-ring',
        error ? 'border-rose-400' : 'border-slate-300 focus:border-primary',
        className,
      )}
      aria-invalid={!!error}
      {...props}
    >
      {children}
    </select>
  );

  if (!label && !error && !helper) return control;

  return (
    <FormField
      label={label}
      htmlFor={selectId}
      error={error}
      helper={helper}
      required={required}
      className={fieldClassName}
    >
      {control}
    </FormField>
  );
}
