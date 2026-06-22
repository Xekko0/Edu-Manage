/**
 * Search Controller — API tìm kiếm toàn năng (Omni-Search).
 */
const { Op } = require('sequelize');
const { User, Student, Class, Subject } = require('../models');
const { success, error } = require('../utils/responseHelper');

/** GET /search?q=&limit=10 — Tìm kiếm xuyên entity */
const globalSearch = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const limit = Math.min(parseInt(req.query.limit) || 10, 20);

    if (q.length < 2) return success(res, { students: [], classes: [], teachers: [], subjects: [] });

    const like = { [Op.like]: `%${q}%` };
    const userRole = req.user.role;

    // Tìm học sinh
    let students = [];
    if (userRole === 'admin' || userRole === 'subject') {
      students = await Student.findAll({
        include: [
          { model: User, as: 'user', where: { full_name: like }, attributes: ['id', 'full_name', 'email'] },
          { model: Class, as: 'class', attributes: ['id', 'name'] },
        ],
        attributes: ['id', 'student_code'],
        limit,
      });
    }

    // Tìm lớp
    const classes = await Class.findAll({
      where: { name: like },
      attributes: ['id', 'name', 'grade_level', 'school_year'],
      limit,
    });

    // Tìm giáo viên
    let teachers = [];
    if (userRole === 'admin') {
      teachers = await User.findAll({
        where: { role: 'subject', [Op.or]: [{ full_name: like }, { email: like }] },
        attributes: ['id', 'full_name', 'email'],
        limit,
      });
    }

    // Tìm môn học
    const subjects = await Subject.findAll({
      where: { [Op.or]: [{ name: like }, { code: like }] },
      attributes: ['id', 'code', 'name'],
      limit,
    });

    return success(res, {
      students: students.map((s) => ({
        id: s.id,
        code: s.student_code,
        name: s.user?.full_name,
        class: s.class?.name,
        type: 'student',
      })),
      classes: classes.map((c) => ({
        id: c.id,
        name: c.name,
        grade: c.grade_level,
        year: c.school_year,
        type: 'class',
      })),
      teachers: teachers.map((t) => ({
        id: t.id,
        name: t.full_name,
        email: t.email,
        type: 'teacher',
      })),
      subjects: subjects.map((s) => ({
        id: s.id,
        code: s.code,
        name: s.name,
        type: 'subject',
      })),
    });
  } catch (err) {
    return error(res, 'Lỗi tìm kiếm', 500, err.message);
  }
};

module.exports = { globalSearch };
