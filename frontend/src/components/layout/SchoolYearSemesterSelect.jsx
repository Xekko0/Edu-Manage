import { useSchoolYear } from '../../contexts/SchoolYearContext';
import Select from '../ui/Select';

export default function SchoolYearSemesterSelect({ className = '' }) {
  const { schoolYear, semester, setSemester } = useSchoolYear();

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span className="hidden sm:inline text-caption whitespace-nowrap">{schoolYear}</span>
      <Select
        value={String(semester)}
        onChange={(e) => setSemester(Number(e.target.value))}
        className="!w-auto min-w-[100px] py-1.5 text-xs"
        aria-label="Học kỳ"
      >
        <option value="1">HK 1</option>
        <option value="2">HK 2</option>
      </Select>
    </div>
  );
}
