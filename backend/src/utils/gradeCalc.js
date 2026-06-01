/**
 * Công thức tính điểm trung bình môn học và xếp loại.
 * (Theo SRS mục 2.3)
 *
 * TB môn = (Miệng × 1 + TB 15p × 1 + 1 tiết × 2 + HK × 3) / 7
 *
 * Xếp loại:
 *   Giỏi      ≥ 8.0
 *   Khá       6.5 – 7.9
 *   Trung bình 5.0 – 6.4
 *   Yếu       < 5.0
 */

const avg = (arr) => {
  if (!arr || arr.length === 0) return 0;
  const sum = arr.reduce((s, v) => s + Number(v), 0);
  return sum / arr.length;
};

const calcSubjectAverage = (scores) => {
  // scores: [{ score_type, score_value }]
  const oral = scores.filter((s) => s.score_type === 'oral').map((s) => s.score_value);
  const min15 = scores.filter((s) => s.score_type === '15min').map((s) => s.score_value);
  const period = scores.filter((s) => s.score_type === '1period').map((s) => s.score_value);
  const semester = scores.filter((s) => s.score_type === 'semester').map((s) => s.score_value);

  const avgOral = avg(oral);
  const avg15 = avg(min15);
  const avgPeriod = avg(period);
  const avgSemester = avg(semester);

  const total = avgOral * 1 + avg15 * 1 + avgPeriod * 2 + avgSemester * 3;
  return Math.round((total / 7) * 100) / 100; // 2 chữ số thập phân
};

const classifyGrade = (avgScore) => {
  if (avgScore >= 8.0) return 'Giỏi';
  if (avgScore >= 6.5) return 'Khá';
  if (avgScore >= 5.0) return 'Trung bình';
  return 'Yếu';
};

module.exports = { avg, calcSubjectAverage, classifyGrade };
