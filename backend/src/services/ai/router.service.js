/**
 * Lớp 3 — Function Router.
 * Switch theo intent → gọi đúng module backend, KHÔNG gọi LLM (trừ ai_advice).
 *
 * Trả về object: { type, message, payload, chips }
 *   - type:    "scores" | "schedule" | "attendance" | "advice" | "extracurricular" | "fallback"
 *   - payload: dữ liệu kết quả (bảng điểm rút gọn, lịch học rút gọn,...)
 *   - chips:   2-3 gợi ý câu hỏi tiếp theo
 */
const env = require('../../config/env');
const scoreService = require('../score.service');
const adviceService = require('./advice.service');
const { Schedule, Subject, Class, Attendance, Student, Extracurricular } = require('../../models');

const SCHOOL_YEAR = () => env.CURRENT_SCHOOL_YEAR;

const FALLBACK_CHIPS = [
  'Điểm con tôi môn Toán?',
  'Lịch học tuần này',
  'Con có vắng buổi nào không?',
  'Gợi ý ôn Lý cho con',
  'Con đăng ký hoạt động gì?',
];

const route = async (ctx) => {
  const { intent, subject, semester, child_id, class_id } = ctx;

  switch (intent) {
    case 'view_scores': {
      const sem = semester || 1;
      const schoolYear = SCHOOL_YEAR();
      const data = await scoreService.getStudentSubjectAverages(child_id, sem, schoolYear);
      return {
        type: 'scores',
        message: `Bảng điểm học kỳ ${sem} của con:`,
        payload: data,
        chips: ['Xuất PDF học bạ', 'Lịch học tuần này', 'Gợi ý ôn tập'],
      };
    }

    case 'view_scores_subject': {
      const sem = semester || 1;
      const schoolYear = SCHOOL_YEAR();
      const all = await scoreService.getStudentSubjectAverages(child_id, sem, schoolYear);
      const filtered = subject
        ? all.filter((s) => s.subject_name.toLowerCase().includes(subject.toLowerCase()))
        : all;
      return {
        type: 'scores',
        message: `Điểm môn ${subject || 'tất cả môn'} (HK${sem}):`,
        payload: filtered,
        chips: [`Gợi ý ôn ${subject || 'tổng quát'}`, 'Lịch học môn này', 'Xem học bạ đầy đủ'],
      };
    }

    case 'view_schedule': {
      const items = await Schedule.findAll({
        where: { class_id },
        include: [{ model: Subject, as: 'subject' }],
        order: [['day_of_week', 'ASC'], ['period', 'ASC']],
      });
      return {
        type: 'schedule',
        message: 'Lịch học tuần này của con:',
        payload: items,
        chips: ['Điểm con tôi', 'Hoạt động ngoại khóa', 'Con có vắng buổi nào không?'],
      };
    }

    case 'view_attendance': {
      const items = await Attendance.findAll({
        where: { student_id: child_id },
        order: [['attendance_date', 'DESC']],
        limit: 30,
      });
      const absent = items.filter((a) => a.status === 'absent').length;
      return {
        type: 'attendance',
        message: `30 ngày gần đây: ${absent} buổi vắng không phép.`,
        payload: items,
        chips: ['Xem điểm', 'Lịch học tuần này', 'Hoạt động ngoại khóa'],
      };
    }

    case 'view_extracurricular': {
      const student = await Student.findByPk(child_id, {
        include: [{ model: Extracurricular, as: 'activities' }],
      });
      return {
        type: 'extracurricular',
        message: 'Hoạt động ngoại khóa con đã đăng ký:',
        payload: student?.activities || [],
        chips: ['Xem điểm', 'Lịch học tuần này', 'Học bạ'],
      };
    }

    case 'ai_advice': {
      const sem = semester || 1;
      const schoolYear = SCHOOL_YEAR();
      const all = await scoreService.getStudentSubjectAverages(child_id, sem, schoolYear);
      const advice = await adviceService.generateAdvice(all, subject);
      return {
        type: 'advice',
        message: advice.content,
        payload: { subject, allScores: all },
        chips: advice.chips,
      };
    }

    default:
      return {
        type: 'fallback',
        message: 'Mình chưa hiểu câu hỏi. Bạn thử một trong các gợi ý sau nhé:',
        payload: null,
        chips: FALLBACK_CHIPS,
      };
  }
};

module.exports = { route };
