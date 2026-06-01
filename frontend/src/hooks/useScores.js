import { useEffect, useState } from 'react';
import { getStudentScores } from '../api/score.api';

const useScores = (studentId, semester = 1, schoolYear) => {
  const [data, setData] = useState({ items: [], overall: 0 });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    getStudentScores(studentId, { semester, school_year: schoolYear })
      .then((res) => res?.success && setData(res.data))
      .finally(() => setLoading(false));
  }, [studentId, semester, schoolYear]);

  return { ...data, loading };
};

export default useScores;
