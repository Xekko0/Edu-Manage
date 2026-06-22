/**
 * CompetencyProfile — Hồ sơ năng lực HS (Family Portal).
 * Hiển thị Radar Chart + bảng chi tiết proficiency levels.
 */
import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import PageHeader from '../../components/ui/PageHeader';
import Select from '../../components/ui/Select';
import Spinner from '../../components/ui/Spinner';
import Card, { CardBody } from '../../components/ui/Card';
import CompetencyRadar from '../../components/scores/CompetencyRadar';
import StudentSelector from '../../components/family/StudentSelector';
import useStudentContext from '../../hooks/useStudentContext';
import { useSchoolYear } from '../../contexts/SchoolYearContext';
import { getStudentCompetencyProfile } from '../../api/competency.api';

const LEVEL_BADGES = {
  beginner: { label: 'Beginner', color: 'bg-red-100 text-red-700' },
  developing: { label: 'Developing', color: 'bg-amber-100 text-amber-700' },
  proficient: { label: 'Proficient', color: 'bg-green-100 text-green-700' },
  advanced: { label: 'Advanced', color: 'bg-blue-100 text-blue-700' },
};

export default function CompetencyProfile() {
  const { schoolYear, semester } = useSchoolYear();
  const { selectedStudent, loading: ctxLoading } = useStudentContext();
  const [profile, setProfile] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedStudent?.id) return;
    setLoading(true);
    getStudentCompetencyProfile(selectedStudent.id, { semester, school_year: schoolYear })
      .then((res) => {
        if (res?.success) setProfile(res.data || []);
      })
      .catch(() => toast.error('Lỗi tải hồ sơ năng lực'))
      .finally(() => setLoading(false));
  }, [selectedStudent, semester, schoolYear]);

  if (ctxLoading) return <div className="flex justify-center py-16"><Spinner size="lg" /></div>;

  return (
    <div>
      <PageHeader
        title="Hồ sơ năng lực"
        description={`HK${semester} · ${schoolYear}`}
      />

      <StudentSelector />

      {loading ? (
        <div className="flex justify-center py-12"><Spinner /></div>
      ) : !profile.length ? (
        <Card><CardBody className="text-center py-8 text-slate-400">Chưa có dữ liệu năng lực cho học kỳ này.</CardBody></Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Radar Chart */}
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Biểu đồ năng lực</h3>
              <CompetencyRadar profile={profile} height={320} />
            </CardBody>
          </Card>

          {/* Bảng chi tiết */}
          <Card>
            <CardBody>
              <h3 className="text-sm font-semibold text-slate-700 mb-4">Chi tiết theo năng lực</h3>
              <div className="space-y-3">
                {profile.map((p) => {
                  const badge = LEVEL_BADGES[p.proficiency_level] || LEVEL_BADGES.developing;
                  return (
                    <div key={p.competency_id} className="border-b pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-slate-700">{p.competency_name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full ${badge.color}`}>
                          {badge.label}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {p.category === 'core' ? 'Năng lực chung' : p.category === 'subject' ? 'Năng lực môn học' : 'Năng lực liên môn'}
                        {p.score_count > 0 && ` · ${p.score_count} đánh giá`}
                      </div>
                      {/* Proficiency bar */}
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                        <div
                          className={`h-1.5 rounded-full ${
                            p.proficiency_level === 'advanced' ? 'bg-blue-500' :
                            p.proficiency_level === 'proficient' ? 'bg-green-500' :
                            p.proficiency_level === 'developing' ? 'bg-amber-500' : 'bg-red-400'
                          }`}
                          style={{
                            width: `${
                              p.proficiency_level === 'advanced' ? 100 :
                              p.proficiency_level === 'proficient' ? 75 :
                              p.proficiency_level === 'developing' ? 50 : 25
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardBody>
          </Card>
        </div>
      )}
    </div>
  );
}
