import { cn } from '../../utils/cn';

const PERSONA_STYLES = {
  admin: 'bg-violet-100 text-violet-800',
  gvcn: 'bg-teal-100 text-teal-800',
  gvbm: 'bg-cyan-100 text-cyan-800',
  homeroom: 'bg-teal-100 text-teal-800',
  subject: 'bg-cyan-100 text-cyan-800',
  parent: 'bg-amber-100 text-amber-800',
  student: 'bg-emerald-100 text-emerald-800',
};

const PERSONA_LABEL = {
  admin: 'Quản trị',
  gvcn: 'GVCN',
  gvbm: 'GVBM',
  homeroom: 'GVCN',
  subject: 'Giáo viên',
  parent: 'Phụ huynh',
  student: 'Học sinh',
};

/** persona: gvcn | gvbm | admin | parent | student — hoặc role DB */
export default function RoleBadge({ persona, role }) {
  const key = persona || role;
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold',
        PERSONA_STYLES[key] || 'bg-slate-100 text-slate-700',
      )}
    >
      {PERSONA_LABEL[key] || key}
    </span>
  );
}
