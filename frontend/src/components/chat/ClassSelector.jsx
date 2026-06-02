import Select from '../ui/Select';

/** Chọn lớp khi GV/Admin dùng AI (nhiều lớp). */
export default function ClassSelector({
  classes = [],
  selectedId,
  setSelectedId,
  className = '',
}) {
  if (classes.length <= 1) return null;

  return (
    <Select
      label="Chọn lớp"
      className={className}
      value={selectedId || ''}
      onChange={(e) => setSelectedId(Number(e.target.value))}
    >
      {classes.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}{c.grade_level ? ` — Khối ${c.grade_level}` : ''}
        </option>
      ))}
    </Select>
  );
}
