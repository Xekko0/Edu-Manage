/**
 * Score controller — nhập/sửa/xem điểm + xuất PDF học bạ.
 *
 * Phân quyền:
 *   - Admin    : toàn quyền
 *   - GVBM     : nhập/sửa điểm môn × lớp được phân công (qua assignment.middleware)
 *                xem điểm môn mình ở các lớp mình dạy
 *   - GVCN     : xem toàn bộ điểm các môn của LỚP CHỦ NHIỆM
 *                chỉ được NHẬP điểm nếu đồng thời là GVBM của môn đó (assignment có)
 *   - HS/PH    : chỉ xem điểm bản thân / con đã liên kết (qua parent-link.middleware)
 */
const { Op } = require('sequelize');
const { Score, Student, Subject, Class, TeacherAssignment } = require('../models');
const scoreService = require('../services/score.service');
const pdfService = require('../services/pdf.service');
const { success, error } = require('../utils/responseHelper');

const enter = async (req, res) => {
  try {
    const { student_id, subject_id, class_id, score_type, score_value, semester, school_year, note } = req.body;
    const score = await Score.create({
      student_id, subject_id, class_id, score_type, score_value, semester, school_year, note,
      entered_by: req.user.id,
    });
    return success(res, score, 'Nhập điểm thành công', 201);
  } catch (err) {
    return error(res, 'Nhập điểm thất bại', 400, err.message);
  }
};

const bulkEnter = async (req, res) => {
  try {
    const items = (req.body.items || []).map((i) => ({ ...i, entered_by: req.user.id }));
    const created = await Score.bulkCreate(items);
    return success(res, { count: created.length }, 'Nhập điểm hàng loạt thành công');
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
    const [affected] = await Score.update(req.body, { where: { id: req.params.id } });
    return success(res, { affected }, 'Cập nhật điểm thành công');
  } catch (err) {
    return error(res, 'Cập nhật thất bại', 400, err.message);
  }
};

/** PH/HS / GVCN / GVBM / Admin — đã pass parentLink/homeroom middleware ở route. */
const listByStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const { semester = 1, school_year } = req.query;
    const data = await scoreService.getStudentSubjectAverages(student_id, semester, school_year);
    const overall = scoreService.getOverallAverage(data);
    return success(res, { items: data, overall });
  } catch (err) {
    return error(res, 'Lỗi tải bảng điểm', 500, err.message);
  }
};

/** GVCN: xem toàn bộ bảng điểm tất cả HS trong LỚP CHỦ NHIỆM của mình. */
const listByClass = async (req, res) => {
  try {
    const { class_id } = req.params;
    const { semester = 1, school_year } = req.query;

    const cls = await Class.findByPk(class_id);
    if (!cls) return error(res, 'Không tìm thấy lớp', 404);

    const isHomeroom = Number(cls.homeroom_teacher_id) === Number(req.user.id);

    // #region agent log
    fetch('http://127.0.0.1:7598/ingest/50d32c58-c803-483c-84ed-d5e16a0a5512',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c24510'},body:JSON.stringify({sessionId:'c24510',location:'score.controller.js:listByClass',message:'score class access',data:{class_id,userId:req.user.id,homeroomTeacherId:cls.homeroom_teacher_id,isHomeroom,role:req.user.role},timestamp:Date.now(),hypothesisId:'H1'})}).catch(()=>{});
    // #endregion

    // GVCN (role homeroom legacy hoặc subject + chủ nhiệm): xem tất cả môn
    if (req.user.role === 'homeroom' && !isHomeroom) {
      return error(res, 'Bạn không phải GVCN của lớp này', 403);
    }

    // GVBM: cần assignment; GVCN lớp này được xem toàn bộ môn
    let subjectFilter = null;
    if (req.user.role === 'subject') {
      const assignments = await TeacherAssignment.findAll({
        where: { teacher_id: req.user.id, class_id, is_active: true },
      });
      if (!isHomeroom && assignments.length === 0) {
        return error(res, 'Bạn không dạy lớp này', 403);
      }
      if (!isHomeroom) {
        subjectFilter = assignments.map((a) => a.subject_id);
      }
    }

    const students = await Student.findAll({
      where: { class_id },
      attributes: ['id', 'student_code'],
      include: [{ association: 'user', attributes: ['full_name'] }],
      order: [['student_code', 'ASC']],
    });

    const result = [];
    for (const stu of students) {
      let subjects = await scoreService.getStudentSubjectAverages(stu.id, semester, school_year);
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

    const data = await scoreService.getStudentSubjectAverages(student_id, semester, school_year);
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

module.exports = { enter, bulkEnter, update, listByStudent, listByClass, exportGradebookPDF };
