/** S09 — Nhập điểm. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { listStudents } from '../../api/student.api';
import { enterScoresBulk } from '../../api/score.api';
import { SCORE_TYPE_LABEL, CURRENT_SCHOOL_YEAR } from '../../utils/labels';

export default function ScoreEntry() {
  const { loading: clsLoading, assignments } = useTeacherClasses();
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [scoreType, setScoreType] = useState('oral');
  const [semester, setSemester] = useState('1');
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const classOptions = [...new Map(assignments.map((a) => [a.class_id, a.class])).values()];

  useEffect(() => {
    if (classOptions.length && !classId) {
      setClassId(String(classOptions[0]?.id));
    }
  }, [classOptions, classId]);

  const subjectOptions = assignments.filter((a) => String(a.class_id) === String(classId));

  useEffect(() => {
    if (subjectOptions.length) {
      setSubjectId(String(subjectOptions[0]?.subject_id));
    }
  }, [classId, assignments]);

  const loadStudents = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    try {
      const res = await listStudents({ class_id: classId });
      if (res?.success) {
        setStudents(res.data || []);
        setScores({});
      }
    } catch (err) {
      toast.error(err?.message || 'Không tải HS');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const handleSave = async () => {
    const items = students
      .filter((s) => scores[s.id] !== undefined && scores[s.id] !== '')
      .map((s) => ({
        student_id: s.id,
        subject_id: Number(subjectId),
        class_id: Number(classId),
        score_type: scoreType,
        score_value: Number(scores[s.id]),
        semester: Number(semester),
        school_year: CURRENT_SCHOOL_YEAR,
      }));

    if (!items.length) return toast.error('Nhập ít nhất một điểm');
    setSaving(true);
    try {
      const res = await enterScoresBulk(items);
      if (res?.success) {
        toast.success(`Đã lưu ${res.data?.count || items.length} điểm`);
        setScores({});
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu điểm thất bại');
    } finally {
      setSaving(false);
    }
  };

  if (clsLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (!assignments.length) {
    return (
      <div>
        <PageHeader title="Nhập điểm" />
        <EmptyState message="Bạn chưa được phân công dạy môn nào." />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Nhập điểm">
        <Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu điểm'}</Button>
      </PageHeader>

      <div className="bg-white p-4 rounded-lg border mb-4 grid grid-cols-1 md:grid-cols-4 gap-3">
        <Select label="Lớp" value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Môn" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjectOptions.map((a) => (
            <option key={a.id} value={a.subject_id}>{a.subject?.name}</option>
          ))}
        </Select>
        <Select label="Loại điểm" value={scoreType} onChange={(e) => setScoreType(e.target.value)}>
          {Object.entries(SCORE_TYPE_LABEL).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
        <Select label="Học kỳ" value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="1">HK 1</option>
          <option value="2">HK 2</option>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <div className="bg-white rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-3 py-2 text-left">Mã HS</th>
                <th className="px-3 py-2 text-left">Họ tên</th>
                <th className="px-3 py-2 text-center w-28">Điểm (0–10)</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-t">
                  <td className="px-3 py-2 font-mono text-xs">{s.student_code}</td>
                  <td className="px-3 py-2">{s.user?.full_name}</td>
                  <td className="px-3 py-2">
                    <input
                      type="number"
                      min="0"
                      max="10"
                      step="0.25"
                      className="w-full px-2 py-1 border rounded text-center"
                      value={scores[s.id] ?? ''}
                      onChange={(e) => setScores({ ...scores, [s.id]: e.target.value })}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
