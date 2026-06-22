/**
 * Exam & GPA Service — Quản lý Kỳ thi, Bảng điểm, GPA.
 * exam_periods + assessments + transcripts + grading_scales
 */
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Assessment, ExamPeriod, Transcript, GradingScale, Student, Subject, Score } = require('../models');
const scoreService = require('./score.service');

/** Quy đổi điểm thang 10 → chữ → GPA */
const gradeFromScore = async (rawScore) => {
  const scale = await GradingScale.findOne({
    where: {
      min_score: { [Op.lte]: rawScore },
      max_score: { [Op.gte]: rawScore },
      is_active: true,
    },
  });
  if (scale) return { letter_grade: scale.letter_grade, gpa_points: Number(scale.gpa_points) };
  return { letter_grade: 'F', gpa_points: 0 };
};

/** Tính GPA cho 1 HS theo kỳ */
const computeTranscript = async (studentId, semester, schoolYear) => {
  const subjectAverages = await scoreService.getStudentSubjectAverages(studentId, semester, schoolYear, true);
  if (subjectAverages.length === 0) return null;

  const overall = scoreService.getOverallAverage(subjectAverages);
  const { letter_grade, gpa_points } = await gradeFromScore(overall);

  // Tính xếp hạng lớp
  const student = await Student.findByPk(studentId);
  const classStudents = await Student.findAll({ where: { class_id: student.class_id }, attributes: ['id'] });
  const classIds = classStudents.map((s) => s.id);

  // Tính TB chung cho tất cả HS lớp
  const allAverages = [];
  for (const sid of classIds) {
    const avg = scoreService.getOverallAverage(
      await scoreService.getStudentSubjectAverages(sid, semester, schoolYear, true)
    );
    if (avg > 0) allAverages.push({ id: sid, avg });
  }
  allAverages.sort((a, b) => b.avg - a.avg);
  const rank = allAverages.findIndex((a) => a.id === studentId) + 1;

  // Upsert transcript
  const [transcript] = await Transcript.upsert({
    student_id: studentId,
    semester,
    school_year: schoolYear,
    overall_average: Math.round(overall * 100) / 100,
    letter_grade,
    gpa_score: gpa_points,
    class_rank: rank || null,
    computed_at: new Date(),
  });

  return transcript;
};

/** Batch compute transcripts cho cả lớp */
const computeClassTranscripts = async (classId, semester, schoolYear) => {
  const students = await Student.findAll({ where: { class_id: classId }, attributes: ['id'] });
  const results = [];
  for (const s of students) {
    const t = await computeTranscript(s.id, semester, schoolYear);
    if (t) results.push(t);
  }
  return results;
};

/** Lấy transcript của 1 HS */
const getStudentTranscript = async (studentId, semester, schoolYear) => {
  return Transcript.findOne({
    where: { student_id: studentId, semester, school_year: schoolYear },
  });
};

/** CRUD Exam Period */
const listExamPeriods = async (filters = {}) => {
  const where = {};
  if (filters.school_year) where.school_year = filters.school_year;
  if (filters.semester) where.semester = filters.semester;
  return ExamPeriod.findAll({ where, order: [['start_date', 'ASC']] });
};

const createExamPeriod = async (data) => ExamPeriod.create(data);
const updateExamPeriod = async (id, data) => {
  const ep = await ExamPeriod.findByPk(id);
  if (!ep) throw new Error('Không tìm thấy kỳ thi');
  return ep.update(data);
};

module.exports = {
  gradeFromScore,
  computeTranscript,
  computeClassTranscripts,
  getStudentTranscript,
  listExamPeriods,
  createExamPeriod,
  updateExamPeriod,
};
