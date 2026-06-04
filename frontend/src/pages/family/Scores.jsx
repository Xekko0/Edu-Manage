/** S10 — Xem bảng điểm (SRS 2.4.2). */
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
import Card, { CardBody } from '../../components/ui/Card';
import { getStudentScores, downloadGradebookPDF } from '../../api/score.api';
import { downloadBlob } from '../../utils/format';
import { useSchoolYear } from '../../contexts/SchoolYearContext';

export default function Scores() {
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
        if (!cancelled) toast.error(err?.message || 'Không tải được bảng điểm');
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
      downloadBlob(blob, `bangdiem_${code}.pdf`);
      toast.success('Đã tải PDF');
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
      <PageHeader title="Bảng điểm">
        <Button onClick={handleExport} disabled={exporting || !selectedId}>
          {exporting ? 'Đang xuất…' : 'Xuất PDF'}
        </Button>
      </PageHeader>

      <Card className="mb-4">
        <CardBody className="grid grid-cols-1 md:grid-cols-3 gap-4 !py-4">
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
          {overall != null && (
            <div className="flex items-center gap-2 text-sm p-3 rounded-lg bg-teal-50 border border-teal-100">
              <span className="text-slate-600">TB chung:</span>
              <b className="text-xl text-teal-800">{Number(overall).toFixed(2)}</b>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody>
          {loading ? (
            <div className="flex justify-center py-12"><Spinner /></div>
          ) : (
            <ScoreTable items={items} />
          )}
        </CardBody>
      </Card>
    </div>
  );
}
