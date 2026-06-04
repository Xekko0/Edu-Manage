import { createContext, useContext, useMemo, useState } from 'react';
import { CURRENT_SCHOOL_YEAR } from '../utils/labels';
import useAuth from '../hooks/useAuth';

const SchoolYearContext = createContext({
  schoolYear: CURRENT_SCHOOL_YEAR,
  semester: 1,
  setSemester: () => {},
});

export function SchoolYearProvider({ children }) {
  const { user } = useAuth();
  const [semester, setSemester] = useState(1);

  const schoolYear = useMemo(
    () => user?.capabilities?.school_year || user?.school_year || CURRENT_SCHOOL_YEAR,
    [user],
  );

  const value = useMemo(
    () => ({ schoolYear, semester, setSemester }),
    [schoolYear, semester],
  );

  return (
    <SchoolYearContext.Provider value={value}>
      {children}
    </SchoolYearContext.Provider>
  );
}

export function useSchoolYear() {
  return useContext(SchoolYearContext);
}

export default SchoolYearContext;
