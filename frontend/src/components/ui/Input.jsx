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
        'placeholder:text-slate-400 min-h-[40px]',
        error ? 'border-rose-400 bg-rose-50/40' : 'border-slate-300 focus:border-primary hover:border-slate-400',
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
