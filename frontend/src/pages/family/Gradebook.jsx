/** S11 — Học bạ điện tử (SRS 2.3). */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import ScoreTable from '../../components/scores/ScoreTable';
import PageHeader from '../../components/ui/PageHeader';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import StudentSelector from '../../components/family/StudentSelector';
import useStudentContext from '../../hooks/useStudentContext';
import Spinner from '../../components/ui/Spinner';
import EmptyState from '../../components/ui/EmptyState';
import { getStudentScores, downloadGradebookPDF } from '../../api/score.api';
import { downloadBlob } from '../../utils/format';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

export default function Gradebook() {
  const { schoolYear } = useSchoolYear();
  const {
    loading: ctxLoading, error: ctxError, selectedId, selectedStudent,
    students, setSelectedId, isParent,
  } = useStudentContext();
  const [items, setItems] = useState([]);
  const [overall, setOverall] = useState(null);
  const [loading, setLoading] = useState(false);
  const [semester, setSemester] = useState('1');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const res = await getStudentScores(selectedId, {
          semester,
          school_year: schoolYear,
        });
        if (!cancelled && res?.success) {
          setItems(res.data.items || []);
          setOverall(res.data.overall ?? null);
        }
      } catch (err) {
        if (!cancelled) toast.error(err?.message || 'Không tải được học bạ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [selectedId, semester]);

  const handleExport = async () => {
    if (!selectedId) return;
    setExporting(true);
    try {
      const blob = await downloadGradebookPDF(selectedId, {
        semester,
        school_year: schoolYear,
      });
      const code = selectedStudent?.student_code || selectedId;
      downloadBlob(blob, `hocba_${code}.pdf`);
      toast.success('Đã tải học bạ PDF');
    } catch (err) {
      toast.error(err?.message || 'Xuất PDF thất bại');
    } finally {
      setExporting(false);
    }
  };

  if (ctxLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner size="lg" />
      </div>
    );
  }

  if (ctxError) return <EmptyState message={ctxError} />;

  return (
    <div>
      <PageHeader title="Học bạ điện tử">
        <Button onClick={handleExport} disabled={exporting || !selectedId}>
          {exporting ? 'Đang tải…' : 'Tải PDF học bạ'}
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <StudentSelector
          students={students}
          selectedId={selectedId}
          setSelectedId={setSelectedId}
          isParent={isParent}
        />
        <Select label="Học kỳ" value={semester} onChange={(e) => setSemester(e.target.value)}>
          <option value="1">Học kỳ 1</option>
          <option value="2">Học kỳ 2</option>
        </Select>
      </div>

      <div className="bg-white p-6 rounded-lg border mb-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-slate-500">Học sinh:</span> {selectedStudent?.user?.full_name || '—'}</div>
          <div><span className="text-slate-500">Mã HS:</span> {selectedStudent?.student_code || '—'}</div>
          <div><span className="text-slate-500">Lớp:</span> {selectedStudent?.class?.name || '—'}</div>
          <div><span className="text-slate-500">Năm học:</span> {schoolYear}</div>
        </div>
        {overall != null && (
          <p className="mt-3 text-sm">
            <span className="text-slate-500">Điểm TB chung HK{semester}:</span>{' '}
            <b className="text-brand">{Number(overall).toFixed(2)}</b>
          </p>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : (
        <ScoreTable items={items} />
      )}
    </div>
  );
}
