import { cn } from '../../utils/cn';
import FormField from './FormField';

export default function Input({
  label,
  error,
  helper,
  required,
  id,
  className = '',
  fieldClassName = '',
  ...props
}) {
  const inputId = id || props.name;

  const control = (
    <input
      id={inputId}
      className={cn(
        'w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus-ring',
        error ? 'border-rose-400' : 'border-slate-300 focus:border-primary',
        className,
      )}
      aria-invalid={!!error}
      {...props}
    />
  );

  if (!label && !error && !helper) return control;

  return (
    <FormField
      label={label}
      htmlFor={inputId}
      error={error}
      helper={helper}
      required={required}
      className={fieldClassName}
    >
      {control}
    </FormField>
  );
}
