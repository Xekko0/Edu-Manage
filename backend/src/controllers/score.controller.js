/**
 * Score controller — nhập/sửa/xem điểm + xuất PDF học bạ.
 *
 * Phân quyền:
 *   - Admin    : toàn quyền
 *   - GVBM     : nhập/sửa điểm môn × lớp được phân công (qua assignment.middleware)
 *                xem điểm môn mình ở các lớp mình dạy
 *   - GVCN     : xem toàn bộ điểm các môn của LỚP CHỦ NHIỆM
 *                chỉ được NHẬP điểm nếu đồng thời là GVBM của môn đó (assignment có)
 *   - HS/PH    : chỉ xem điểm đã published / con đã liên kết (qua parent-link.middleware)
 *
 * Trạng thái điểm (v2.0):
 *   - draft     : GVBM nhập, chỉ GV/Admin thấy
 *   - published : Đã công bố, PH/HS thấy
 */
const { Op } = require('sequelize');
const { Score, Student, Subject, Class, TeacherAssignment, ScoreAuditLog } = require('../models');
const scoreService = require('../services/score.service');
const pdfService = require('../services/pdf.service');
const { success, error } = require('../utils/responseHelper');

const enter = async (req, res) => {
  try {
    const { student_id, subject_id, class_id, score_type, score_value, semester, school_year, note } = req.body;
    const score = await Score.create({
      student_id, subject_id, class_id, score_type, score_value, semester, school_year, note,
      entered_by: req.user.id,
      status: 'draft', // v2.0: mặc định là bản nháp
    });
    return success(res, score, 'Nhập điểm thành công (bản nháp)', 201);
  } catch (err) {
    return error(res, 'Nhập điểm thất bại', 400, err.message);
  }
};

const bulkEnter = async (req, res) => {
  try {
    const items = (req.body.items || []).map((i) => ({
      ...i,
      entered_by: req.user.id,
      status: 'draft', // v2.0: mặc định là bản nháp
    }));
    const created = await Score.bulkCreate(items);
    return success(res, { count: created.length }, 'Nhập điểm hàng loạt thành công (bản nháp)');
  } catch (err) {
    return error(res, 'Nhập điểm hàng loạt thất bại', 400, err.message);
  }
};

const update = async (req, res) => {
  try {
    // Phải kiểm tra quyền: chỉ sửa điểm môn × lớp mà mình được phân công
    if (req.user.role !== 'admin') {
      const score = await Score.findByPk(req.params.id);
      if (!score) return error(res, 'Không tìm thấy điểm', 404);
      // v2.0: không cho sửa điểm đã published (trừ admin)
      if (score.status === 'published') {
        return error(res, 'Không thể sửa điểm đã công bố. Liên hệ admin để chỉnh sửa.', 403);
      }
      const allowed = await TeacherAssignment.findOne({
        where: {
          teacher_id: req.user.id,
          class_id: score.class_id,
          subject_id: score.subject_id,
          is_active: true,
        },
      });
      if (!allowed) return error(res, 'Bạn không được sửa điểm môn/lớp này', 403);
    }
    // TC17: Audit logging — ghi lại giá trị cũ trước khi sửa
    const oldScore = await Score.findByPk(req.params.id);
    const oldValue = oldScore ? Number(oldScore.score_value) : null;

    const [affected] = await Score.update(req.body, { where: { id: req.params.id } });

    // Ghi audit log (không thể xóa)
    if (affected > 0 && req.body.score_value !== undefined) {
      await ScoreAuditLog.create({
        score_id: req.params.id,
        old_value: oldValue,
        new_value: req.body.score_value,
        modified_by: req.user.id,
        reason: req.body.reason || null,
      });
    }

    return success(res, { affected }, 'Cập nhật điểm thành công');
  } catch (err) {
    return error(res, 'Cập nhật thất bại', 400, err.message);
  }
};

/** POST /scores/publish — GVBM công bố điểm draft → published */
const publishScores = async (req, res) => {
  try {
    const { student_id, subject_id, class_id, semester, school_year } = req.body;

    // Build where clause — GVBM chỉ publish điểm mình nhập
    const where = { status: 'draft' };
    if (student_id) where.student_id = student_id;
    if (subject_id) where.subject_id = subject_id;
    if (class_id) where.class_id = class_id;
    if (semester) where.semester = semester;
    if (school_year) where.school_year = school_year;

    // GVBM chỉ publish điểm của mình
    if (req.user.role !== 'admin') {
      where.entered_by = req.user.id;
    }

    const [affected] = await Score.update(
      { status: 'published', published_at: new Date() },
      { where },
    );

    return success(res, { affected }, `Đã công bố ${affected} đầu điểm`);
  } catch (err) {
    return error(res, 'Lỗi công bố điểm', 400, err.message);
  }
};

/**
 * PH/HS / GVCN / GVBM / Admin — đã pass parentLink/homeroom middleware ở route.
 * v2.0: PH/HS chỉ thấy điểm published, GV/Admin thấy cả draft.
 */
const listByStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { semester = 1, school_year } = req.query;

    // v2.0: xác định filter status theo role
    const isFamily = ['parent', 'student'].includes(req.user.role);

    const data = await scoreService.getStudentSubjectAverages(student_id, semester, school_year, isFamily);
    const overall = scoreService.getOverallAverage(data);
    return success(res, { items: data, overall });
  } catch (err) {
    return error(res, 'Lỗi tải bảng điểm', 500, err.message);
  }
};

/** GVCN: xem toàn bộ môn; GVBM: chỉ môn được phân công (classView middleware). */
const listByClass = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { semester = 1, school_year } = req.query;

    const view = req.classView || {};
    const subjectFilter = view.isHomeroom ? null : (view.subjectIds || null);

    const students = await Student.findAll({
      where: { class_id },
      attributes: ['id', 'student_code'],
      include: [{ association: 'user', attributes: ['full_name'] }],
      order: [['student_code', 'ASC']],
    });

    const result = [];
    for (const stu of students) {
      let subjects = await scoreService.getStudentSubjectAverages(stu.id, semester, school_year, false);
      if (subjectFilter) {
        subjects = subjects.filter((s) => subjectFilter.includes(s.subject_id));
      }
      result.push({
        student_id: stu.id,
        student_code: stu.student_code,
        full_name: stu.user?.full_name,
        subjects,
        overall: scoreService.getOverallAverage(subjects),
      });
    }
    return success(res, result);
  } catch (err) {
    return error(res, 'Lỗi tải bảng điểm lớp', 500, err.message);
  }
};

const exportGradebookPDF = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { semester = 1, school_year } = req.query;
    const student = await Student.findByPk(student_id, { include: ['user', 'class'] });
    if (!student) return error(res, 'Không tìm thấy học sinh', 404);

    const data = await scoreService.getStudentSubjectAverages(student_id, semester, school_year, true);
    const overall = scoreService.getOverallAverage(data);
    const buffer = await pdfService.generateGradebookPDF(
      { full_name: student.user.full_name, student_code: student.student_code, class_name: student.class?.name },
      data,
      overall,
    );
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="hocba_${student.student_code}.pdf"`);
    return res.end(buffer);
  } catch (err) {
    return error(res, 'Lỗi xuất PDF', 500, err.message);
  }
};

module.exports = { enter, bulkEnter, update, publishScores, listByStudent, listByClass, exportGradebookPDF };
