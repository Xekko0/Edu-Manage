import { ROLE_LABEL } from '../../utils/labels';

const styles = {
  admin: 'bg-purple-100 text-purple-800',
  subject: 'bg-cyan-100 text-cyan-800',
  parent: 'bg-amber-100 text-amber-800',
  student: 'bg-green-100 text-green-800',
};

export default function RoleBadge({ role }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${styles[role] || 'bg-slate-100 text-slate-700'}`}>
      {ROLE_LABEL[role] || role}
    </span>
  );
}
