import Select from '../ui/Select';

/** Chọn con khi PH có nhiều HS liên kết. */
export default function StudentSelector({
  students = [],
  selectedId,
  setSelectedId,
  isParent,
  className = '',
}) {
  if (!isParent || students.length <= 1) return null;

  return (
    <Select
      label="Chọn học sinh"
      className={className}
      value={selectedId || ''}
      onChange={(e) => setSelectedId(Number(e.target.value))}
    >
      {students.map((s) => (
        <option key={s.id} value={s.id}>
          {s.user?.full_name || s.student_code} — {s.class?.name}
        </option>
      ))}
    </Select>
  );
}
