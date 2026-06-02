import { useNavigate } from 'react-router-dom';

/**
 * Quick Chips — hỗ trợ gửi text hoặc điều hướng (path).
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

  return (
    <div className="px-3 py-2 border-t bg-white flex flex-col gap-2">
      {chipActions?.length > 0 && (
        <div className="flex gap-2 overflow-x-auto">
          {chipActions.map((action, i) => (
            <button
              key={`nav-${i}`}
              type="button"
              onClick={() => handleAction(action)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-slate-400 text-slate-700 hover:bg-slate-100"
            >
              → {action.label}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2 overflow-x-auto">
        {(chips || []).map((chip, i) => {
          const text = typeof chip === 'string' ? chip : chip.text;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(text)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-brand text-brand hover:bg-brand hover:text-white transition-colors"
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
