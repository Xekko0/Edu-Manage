/**
 * Exam Controller — API Kỳ thi, GPA, Transcripts.
 */
const examService = require('../services/exam.service');
const { success, error } = require('../utils/responseHelper');

/** POST /exam/transcripts/compute — Tính GPA cho 1 HS */
const computeTranscript = async (req, res) => {
  try {
    const { student_id, semester, school_year } = req.body;
    const transcript = await examService.computeTranscript(student_id, semester, school_year);
    return success(res, transcript, 'Tính GPA thành công');
  } catch (err) {
    return error(res, 'Lỗi tính GPA', 500, err.message);
  }
};

/** POST /exam/transcripts/compute-class — Tính GPA cả lớp */
const computeClassTranscripts = async (req, res) => {
  try {
    const { class_id, semester, school_year } = req.body;
    const transcripts = await examService.computeClassTranscripts(class_id, semester, school_year);
    return success(res, { count: transcripts.length, transcripts }, 'Tính GPA lớp thành công');
  } catch (err) {
    return error(res, 'Lỗi tính GPA lớp', 500, err.message);
  }
};

/** GET /exam/transcripts/student/:student_id — Xem transcript */
const getStudentTranscript = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { semester = 1, school_year } = req.query;
    const transcript = await examService.getStudentTranscript(student_id, semester, school_year);
    return success(res, transcript);
  } catch (err) {
    return error(res, 'Lỗi tải transcript', 500, err.message);
  }
};

/** GET /exam/periods — Danh sách kỳ thi */
const listExamPeriods = async (req, res) => {
  try {
    const periods = await examService.listExamPeriods(req.query);
    return success(res, periods);
  } catch (err) {
    return error(res, 'Lỗi tải kỳ thi', 500, err.message);
  }
};

/** POST /exam/periods — Tạo kỳ thi (Admin) */
const createExamPeriod = async (req, res) => {
  try {
    const period = await examService.createExamPeriod(req.body);
    return success(res, period, 'Tạo kỳ thi thành công', 201);
  } catch (err) {
    return error(res, 'Lỗi tạo kỳ thi', 400, err.message);
  }
};

/** PUT /exam/periods/:id — Sửa kỳ thi (Admin) */
const updateExamPeriod = async (req, res) => {
  try {
    const period = await examService.updateExamPeriod(req.params.id, req.body);
    return success(res, period);
  } catch (err) {
    return error(res, 'Lỗi sửa kỳ thi', 400, err.message);
  }
};

module.exports = {
  computeTranscript,
  computeClassTranscripts,
  getStudentTranscript,
  listExamPeriods,
  createExamPeriod,
  updateExamPeriod,
};
