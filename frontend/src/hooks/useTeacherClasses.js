import { useState, useEffect, useMemo } from 'react';
import useAuth from './useAuth';
import { listClasses } from '../api/class.api';
import { myAssignments } from '../api/assignment.api';

/** Lớp chủ nhiệm (GVCN) hoặc lớp được phân công (GVBM). */
export default function useTeacherClasses() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [homeroomClass, setHomeroomClass] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState([]);
  const [assignments, setAssignments] = useState([]);

  useEffect(() => {
    if (!user || !['admin', 'subject'].includes(user.role)) {
      setLoading(false);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        setLoading(true);
        const [classRes, assignRes] = await Promise.all([
          listClasses(),
          user.role !== 'admin' ? myAssignments() : Promise.resolve(null),
        ]);
        if (cancelled) return;

        const allClasses = classRes?.data || [];
        const mine = assignRes?.data || [];
        setAssignments(mine);

        // Giáo viên (role=subject) có thể được gán làm GVCN qua classes.homeroom_teacher_id
        if (user.role === 'subject' || user.role === 'admin') {
          const hr = allClasses.find((c) => c.homeroomTeacher?.id === user.id);
          setHomeroomClass(hr || null);
        }

        const classIds = [...new Set(mine.map((a) => a.class_id))];
        setAssignedClasses(allClasses.filter((c) => classIds.includes(c.id)));
      } catch (_) {
        /* ignore */
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => { cancelled = true; };
  }, [user]);

  const teachingClasses = useMemo(() => {
    if (user?.role === 'admin') return [];
    const uniq = new Map(
      [...(homeroomClass ? [homeroomClass] : []), ...assignedClasses].map((c) => [c.id, c]),
    );
    return [...uniq.values()];
  }, [user?.role, homeroomClass, assignedClasses]);

  return {
    loading,
    homeroomClass,
    assignedClasses,
    assignments,
    teachingClasses,
  };
}
