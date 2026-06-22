/**
 * Service tính TB môn, TB chung, xếp loại học kỳ.
 * v2.0: hỗ trợ publishedOnly filter cho PH/HS.
 */
const { Score, Subject } = require('../models');
const { calcSubjectAverage, classifyGrade } = require('../utils/gradeCalc');

const getStudentSubjectAverages = async (studentId, semester, schoolYear, publishedOnly = false) => {
  const where = { student_id: studentId, semester, school_year: schoolYear };
  if (publishedOnly) where.status = 'published';

  const scores = await Score.findAll({
    where,
    include: [{ model: Subject, as: 'subject' }],
  });

  const grouped = {};
  scores.forEach((s) => {
    const sid = s.subject_id;
    if (!grouped[sid]) grouped[sid] = { subject: s.subject, items: [] };
    grouped[sid].items.push({ score_type: s.score_type, score_value: Number(s.score_value) });
  });

  return Object.values(grouped).map(({ subject, items }) => {
    const average = calcSubjectAverage(items);
    return {
      subject_id: subject.id,
      subject_name: subject.name,
      average,
      grade: classifyGrade(average),
      details: items,
    };
  });
};

const getOverallAverage = (subjectAverages) => {
  if (!subjectAverages.length) return 0;
  const sum = subjectAverages.reduce((s, a) => s + a.average, 0);
  return Math.round((sum / subjectAverages.length) * 100) / 100;
};

module.exports = { getStudentSubjectAverages, getOverallAverage };
