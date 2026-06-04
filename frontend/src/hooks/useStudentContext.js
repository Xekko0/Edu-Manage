import { useState, useEffect } from 'react';
import useAuth from './useAuth';
import { getMyContext } from '../api/student.api';

/** Lấy hồ sơ HS (bản thân) hoặc danh sách con (PH). */
export default function useStudentContext() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [students, setStudents] = useState([]);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    if (!user || !['parent', 'student'].includes(user.role)) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await getMyContext();
        if (cancelled) return;

        if (!res?.success) {
          setError(res?.message || 'Không tải được hồ sơ');
          return;
        }

        if (res.data.type === 'student') {
          setStudents([res.data.student]);
          setSelectedId(res.data.student.id);
        } else {
          const children = res.data.children || [];
          setStudents(children);
          setSelectedId(children.length === 1 ? (children[0]?.id ?? null) : null);
        }
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Lỗi tải hồ sơ');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const selectedStudent = students.find((s) => s.id === selectedId) || null;

  return {
    loading,
    error,
    students,
    selectedId,
    setSelectedId,
    selectedStudent,
    isParent: user?.role === 'parent',
  };
}
