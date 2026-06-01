/**
 * Quick Chips gợi ý câu hỏi tiếp theo (SRS 2.7.2).
 */
export default function QuickChips({ chips, onPick }) {
  if (!chips?.length) return null;
  return (
    <div className="px-3 py-2 border-t bg-white flex gap-2 overflow-x-auto">
      {chips.map((chip, i) => (
        <button
          key={i}
          onClick={() => onPick(chip)}
          className="shrink-0 text-xs px-3 py-1.5 rounded-full border border-brand text-brand hover:bg-brand hover:text-white transition-colors"
        >
          {chip}
        </button>
      ))}
    </div>
  );
}
