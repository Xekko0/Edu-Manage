/**
 * ScoreGrid Premium — Clean Datasheet Style.
 * Không viền dọc, chỉ border-b siêu mảnh, focus ring indigo mờ,
 * điểm kém hồng thạch, audit popover khi hover.
 */
import { useState, useRef, useCallback, useEffect } from 'react';

export default function ScoreGrid({
  students = [],
  scores = {},
  onScoreChange,
  competencies = [],
  readOnly = false,
}) {
  const [focusedCell, setFocusedCell] = useState(null);
  const [hoveredCell, setHoveredCell] = useState(null);
  const gridRef = useRef(null);

  // Keyboard navigation (Excel-like)
  const handleKeyDown = useCallback((e, row) => {
    const maxRow = students.length - 1;
    switch (e.key) {
      case 'ArrowUp':
        e.preventDefault();
        if (row > 0) setFocusedCell({ row: row - 1 });
        break;
      case 'ArrowDown':
        e.preventDefault();
        if (row < maxRow) setFocusedCell({ row: row + 1 });
        break;
      case 'Enter':
        e.preventDefault();
        if (row < maxRow) setFocusedCell({ row: row + 1 });
        break;
      default:
        break;
    }
  }, [students.length]);

  // Auto-focus on cell change
  useEffect(() => {
    if (!focusedCell) return;
    const input = gridRef.current?.querySelector(`[data-row="${focusedCell.row}"]`);
    if (input) { input.focus(); input.select(); }
  }, [focusedCell]);

  return (
    <div className="bg-white rounded-xl border border-zinc-100 shadow-sm shadow-zinc-100/40 overflow-hidden" ref={gridRef}>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100">
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-20">Mã HS</th>
              <th className="px-4 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider min-w-[150px]">Họ tên</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-32">Điểm</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-32">Năng lực</th>
              <th className="px-4 py-3 text-center text-[11px] font-semibold text-zinc-400 uppercase tracking-wider w-20">TB</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, rowIdx) => {
              const scoreVal = scores[student.id];
              const isWeak = scoreVal !== undefined && scoreVal !== '' && Number(scoreVal) < 5.0;
              const isFocused = focusedCell?.row === rowIdx;
              const isHovered = hoveredCell?.row === rowIdx;

              return (
                <tr
                  key={student.id}
                  className={`border-b border-zinc-100/60 transition-colors ${
                    isFocused ? 'bg-indigo-50/30' : 'hover:bg-zinc-50/50'
                  }`}
                >
                  {/* Mã HS */}
                  <td className="px-4 py-2.5">
                    <span className="font-mono text-xs text-zinc-400">{student.student_code}</span>
                  </td>

                  {/* Họ tên */}
                  <td className="px-4 py-2.5">
                    <span className="text-sm font-medium text-zinc-700">{student.user?.full_name}</span>
                  </td>

                  {/* Điểm */}
                  <td className="px-4 py-2.5 text-center">
                    <div className="relative inline-block">
                      <input
                        type="number"
                        min="0"
                        max="10"
                        step="0.25"
                        data-row={rowIdx}
                        disabled={readOnly}
                        value={scoreVal ?? ''}
                        onChange={(e) => onScoreChange?.(student.id, e.target.value)}
                        onFocus={() => setFocusedCell({ row: rowIdx })}
                        onKeyDown={(e) => handleKeyDown(e, rowIdx)}
                        onMouseEnter={() => setHoveredCell({ row: rowIdx })}
                        onMouseLeave={() => setHoveredCell(null)}
                        className={`w-20 px-2.5 py-1.5 text-center text-sm font-medium rounded-lg outline-none transition-all ${
                          isWeak
                            ? 'bg-rose-50/50 text-rose-600 border border-rose-200/60 focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400'
                            : 'bg-zinc-50/50 text-zinc-700 border border-zinc-200/60 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400'
                        }`}
                      />

                      {/* Audit Popover on hover */}
                      {isHovered && scoreVal !== undefined && scoreVal !== '' && (
                        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-20 animate-in fade-in zoom-in-95">
                          <div className="bg-zinc-900/90 backdrop-blur-md text-white rounded-xl shadow-xl p-3 min-w-[200px] border border-zinc-800">
                            <div className="text-[10px] font-semibold text-zinc-400 mb-1.5 flex items-center gap-1">
                              ✏️ Lịch sử chỉnh sửa
                            </div>
                            <div className="text-xs text-zinc-300">
                              <div>Giá trị: <span className="font-medium text-white">{scoreVal}</span></div>
                              <div className="text-[10px] text-zinc-500 mt-1">Chưa có lịch sử</div>
                            </div>
                            <div className="absolute top-full left-1/2 -translate-x-1/2">
                              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[5px] border-transparent border-t-zinc-900/90" />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Năng lực chip */}
                  <td className="px-4 py-2.5 text-center">
                    {competencies.length > 0 ? (
                      <select className="text-[10px] bg-zinc-50 border border-zinc-200/60 rounded-lg px-2 py-1 text-zinc-500 outline-none focus:ring-2 focus:ring-indigo-500/20">
                        <option value="">—</option>
                        {competencies.map((c) => (
                          <option key={c.id} value={c.id}>{c.code}</option>
                        ))}
                      </select>
                    ) : (
                      <span className="text-[10px] text-zinc-300">—</span>
                    )}
                  </td>

                  {/* TB */}
                  <td className="px-4 py-2.5 text-center">
                    <span className="text-xs text-zinc-300">—</span>
                  </td>
                </tr>
              );
            })}

            {!students.length && (
              <tr>
                <td colSpan={5} className="px-4 py-16 text-center">
                  <div className="text-zinc-200 mb-2">📋</div>
                  <p className="text-sm text-zinc-400">Không có học sinh trong lớp</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
