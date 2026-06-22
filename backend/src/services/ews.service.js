/**
 * EWS (Early Warning System) — tính toán chỉ số rủi ro theo mô hình ABC.
 * A = Attendance (Chuyên cần), B = Behavior (Nề nếp), C = Course Performance (Điểm số)
 */
const { Op } = require('sequelize');
const sequelize = require('../config/database');
const { Attendance, Evaluation, Score, Student, EWSRiskScore } = require('../models');
const scoreService = require('./score.service');

/** Trọng số ABC */
const WEIGHTS = { attendance: 0.3, behavior: 0.2, academic: 0.5 };

/** Ngưỡng risk level */
const THRESHOLDS = { low: 75, medium: 50, high: 25 };

const classifyRisk = (index) => {
  if (index >= THRESHOLDS.low) return 'low';
  if (index >= THRESHOLDS.medium) return 'medium';
  if (index >= THRESHOLDS.high) return 'high';
  return 'critical';
};

/** Tính điểm chuyên cần (0–100) */
const computeAttendanceScore = async (studentId, semester, schoolYear) => {
  // Đếm số buổi vắng không phép
  const totalAbsent = await Attendance.count({
    where: { student_id: studentId, status: 'absent' },
  });
  // Tổng buổi học (ước tính từ schedules — lấy distinct dates)
  const totalDays = await Attendance.count({
    where: { student_id: studentId },
    distinct: true,
    col: 'attendance_date',
  });
  if (totalDays === 0) return 100; // chưa có dữ liệu → mặc định tốt
  const presentRate = ((totalDays - totalAbsent) / totalDays) * 100;
  return Math.round(Math.max(0, Math.min(100, presentRate)) * 100) / 100;
};

/** Tính điểm nề nếp (0–100) */
const computeBehaviorScore = async (studentId, semester, schoolYear) => {
  const conductMap = { excellent: 100, good: 75, fair: 50, weak: 25 };
  const evaluations = await Evaluation.findAll({
    where: {
      student_id: studentId,
      type: 'conduct',
      ...(semester ? { semester } : {}),
      ...(schoolYear ? { school_year: schoolYear } : {}),
    },
  });

  if (evaluations.length === 0) return 75; // chưa có đánh giá → mặc định

  const avgConduct = evaluations.reduce((sum, e) => sum + (conductMap[e.conduct_grade] || 50), 0) / evaluations.length;
  return Math.round(Math.max(0, Math.min(100, avgConduct)) * 100) / 100;
};

/** Tính điểm học tập (0–100) */
const computeAcademicScore = async (studentId, semester, schoolYear) => {
  const subjectAverages = await scoreService.getStudentSubjectAverages(studentId, semester, schoolYear);
  if (subjectAverages.length === 0) return 50;

  const overall = scoreService.getOverallAverage(subjectAverages);
  // Điểm TB × 10 (thang 0–100) + bonus nếu xu hướng tăng
  let score = overall * 10;

  // Bonus xu hướng: so sánh HK1 vs HK2 (nếu có cả 2)
  if (semester === 2) {
    const hk1Avg = await scoreService.getOverallAverage(
      await scoreService.getStudentSubjectAverages(studentId, 1, schoolYear)
    );
    if (overall > hk1Avg) score += 5; // bonus nếu cải thiện
  }

  return Math.round(Math.max(0, Math.min(100, score)) * 100) / 100;
};

/** Tính tổng hợp chỉ số rủi ro cho 1 HS */
const computeRiskIndex = async (studentId, semester, schoolYear) => {
  const [attendance, behavior, academic] = await Promise.all([
    computeAttendanceScore(studentId, semester, schoolYear),
    computeBehaviorScore(studentId, semester, schoolYear),
    computeAcademicScore(studentId, semester, schoolYear),
  ]);

  const composite = Math.round(
    (attendance * WEIGHTS.attendance + behavior * WEIGHTS.behavior + academic * WEIGHTS.academic) * 100
  ) / 100;

  const riskLevel = classifyRisk(composite);
  const flaggedAt = riskLevel === 'critical' || riskLevel === 'high' ? new Date() : null;

  // Upsert vào DB
  const [record] = await EWSRiskScore.upsert({
    student_id: studentId,
    semester,
    school_year: schoolYear,
    attendance_score: attendance,
    behavior_score: behavior,
    academic_score: academic,
    composite_index: composite,
    risk_level: riskLevel,
    flagged_at: flaggedAt,
    computed_at: new Date(),
  });

  return record;
};

/** Batch tính cho cả lớp */
const computeClassRiskScores = async (classId, semester, schoolYear) => {
  const students = await Student.findAll({ where: { class_id: classId } });
  const results = [];
  for (const s of students) {
    const risk = await computeRiskIndex(s.id, semester, schoolYear);
    results.push(risk);
  }
  return results;
};

/** Lấy tổng hợp dashboard */
const getDashboardSummary = async (semester, schoolYear) => {
  const records = await EWSRiskScore.findAll({
    where: { semester, school_year: schoolYear },
  });

  const summary = { total: records.length, critical: 0, high: 0, medium: 0, low: 0 };
  records.forEach((r) => { summary[r.risk_level]++; });
  return summary;
};

module.exports = {
  computeAttendanceScore,
  computeBehaviorScore,
  computeAcademicScore,
  computeRiskIndex,
  computeClassRiskScores,
  getDashboardSummary,
  WEIGHTS,
  THRESHOLDS,
};
