/**
 * Toggle — Công tắc bật/tắt mượt mà (Web Push, Notifications).
 * Thay thế nút bấm thô cứng bằng toggle switch cao cấp.
 */
export default function Toggle({ checked, onChange, label, description, disabled = false }) {
  return (
    <label className={`flex items-center justify-between gap-3 ${disabled ? 'opacity-50' : 'cursor-pointer'}`}>
      <div className="flex-1 min-w-0">
        {label && <div className="text-sm font-medium text-zinc-700">{label}</div>}
        {description && <div className="text-xs text-zinc-400 mt-0.5">{description}</div>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={`relative inline-flex h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500/20 ${
          checked ? 'bg-indigo-500' : 'bg-zinc-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition-transform duration-200 ease-in-out mt-0.5 ${
            checked ? 'translate-x-5 ml-0.5' : 'translate-x-0.5'
          }`}
        />
      </button>
    </label>
  );
}
