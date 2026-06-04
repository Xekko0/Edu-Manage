import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

/**
 * Quick Chips — gửi text hoặc điều hướng (path).
 */
export default function QuickChips({ chips, chipActions, onPick }) {
  const navigate = useNavigate();
  if (!chips?.length && !chipActions?.length) return null;

  const handleAction = (action) => {
    if (action?.path) {
      navigate(action.path);
      return;
    }
    onPick(action?.label || action);
  };

  const pillClass = cn(
    'shrink-0 text-xs px-3 py-2 rounded-full border transition-colors min-h-[36px]',
    'border-teal-200 text-teal-800 hover:bg-teal-600 hover:text-white hover:border-teal-600',
  );

  return (
    <div className="px-3 py-2 border-t border-slate-100 bg-slate-50/80 flex flex-col gap-2">
      {chipActions?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {chipActions.map((action, i) => (
            <button
              key={`nav-${i}`}
              type="button"
              onClick={() => handleAction(action)}
              className={cn(pillClass, 'border-slate-300 text-slate-700 hover:bg-slate-700 hover:border-slate-700')}
            >
              → {action.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto pb-0.5">
        {(chips || []).map((chip, i) => {
          const text = typeof chip === 'string' ? chip : chip.text;
          return (
            <button key={i} type="button" onClick={() => onPick(text)} className={pillClass}>
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
