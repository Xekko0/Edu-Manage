/** S09 — Nhập điểm. */
import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import useTeacherClasses from '../../hooks/useTeacherClasses';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import Card, { CardBody } from '../../components/ui/Card';
import DataTable from '../../components/ui/DataTable';
import { listStudents } from '../../api/student.api';
import { enterScoresBulk, publishScores } from '../../api/score.api';
import { SCORE_TYPE_LABEL } from '../../utils/labels';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

export default function ScoreEntry() {
  const { schoolYear } = useSchoolYear();
  const { loading: clsLoading, assignments } = useTeacherClasses();
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [scoreType, setScoreType] = useState('oral');
  const [semester, setSemester] = useState('1');
  const [students, setStudents] = useState([]);
  const [scores, setScores] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const classOptions = [...new Map(
    assignments.map((a) => [
      a.class_id,
      a.class || { id: a.class_id, name: a.class_name },
    ]),
  ).values()].filter((c) => c?.id);

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
        school_year: schoolYear,
      }));

    if (!items.length) return toast.error('Nhập ít nhất một điểm');
    setSaving(true);
    try {
      const res = await enterScoresBulk(items);
      if (res?.success) {
        toast.success(`Đã lưu ${res.data?.count || items.length} điểm (bản nháp)`);
        setScores({});
      }
    } catch (err) {
      toast.error(err?.message || 'Lưu điểm thất bại');
    } finally {
      setSaving(false);
    }
  };

  // v2.0: Công bố điểm draft → published
  const handlePublish = async () => {
    if (!confirm('Công bố điểm đã nhập? Phụ huynh và học sinh sẽ thấy điểm ngay.')) return;
    setSaving(true);
    try {
      const res = await publishScores({
        subject_id: Number(subjectId),
        class_id: Number(classId),
        semester: Number(semester),
        school_year: schoolYear,
      });
      if (res?.success) {
        toast.success(res.message || 'Đã công bố điểm');
      }
    } catch (err) {
      toast.error(err?.message || 'Lỗi công bố điểm');
    } finally {
      setSaving(false);
    }
  };

  if (clsLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  if (!assignments.length) {
    return (
      <div>
        <PageHeader title="Nhập điểm" />
        <EmptyState
          title="Chưa có phân công môn"
          description="Admin cần gán bạn dạy môn × lớp (teacher_assignments) trước khi nhập điểm. GVCN chỉ xem điểm cả lớp nếu chưa được phân công dạy môn."
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Nhập điểm">
        <div className="flex items-center gap-2">
          <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">Bản nháp</span>
          <Button variant="outline" onClick={handlePublish} disabled={saving}>Công bố điểm</Button>
          <Button onClick={handleSave} disabled={saving}>{saving ? 'Đang lưu…' : 'Lưu điểm'}</Button>
        </div>
      </PageHeader>

      <Card className="mb-4">
      <CardBody className="grid grid-cols-1 md:grid-cols-4 gap-3 !py-4">
        <Select label="Lớp" value={classId} onChange={(e) => setClassId(e.target.value)}>
          {classOptions.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </Select>
        <Select label="Môn" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          {subjectOptions.map((a) => (
            <option key={a.id || `${a.class_id}-${a.subject_id}`} value={a.subject_id}>
              {a.subject?.name || a.subject_name}
            </option>
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
      </CardBody>
      </Card>

      <Card>
      {loading ? (
        <CardBody><div className="flex justify-center py-12"><Spinner /></div></CardBody>
      ) : (
        <CardBody className="!p-0 sm:!p-0">
          <DataTable
            columns={[
              { key: 'code', label: 'Mã HS', render: (s) => <span className="font-mono text-xs">{s.student_code}</span> },
              { key: 'name', label: 'Họ tên', render: (s) => s.user?.full_name },
              {
                key: 'score',
                label: 'Điểm (0–10)',
                className: 'text-center w-32',
                render: (s) => (
                  <input
                    type="number"
                    min="0"
                    max="10"
                    step="0.25"
                    className="w-full max-w-[88px] mx-auto px-2 py-1.5 border border-slate-300 rounded-lg text-center text-sm focus-ring"
                    value={scores[s.id] ?? ''}
                    onChange={(e) => setScores({ ...scores, [s.id]: e.target.value })}
                    aria-label={`Điểm ${s.user?.full_name}`}
                  />
                ),
              },
            ]}
            data={students}
            emptyMessage="Không có học sinh trong lớp."
          />
        </CardBody>
      )}
      </Card>
    </div>
  );
}
