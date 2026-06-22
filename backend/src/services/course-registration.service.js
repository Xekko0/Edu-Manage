/**
 * Course Registration Service — Đăng ký môn học tự chọn.
 * Sử dụng Database Transaction Lock chống Over-enrollment.
 */
const sequelize = require('../config/database');
const { CourseEnrollment, Subject, Student, CurriculumStandard } = require('../models');
const { Op } = require('sequelize');

/** Lấy danh sách môn tự chọn + sĩ số hiện tại */
const listElectiveCourses = async (semester, schoolYear, gradeLevel) => {
  const subjects = await Subject.findAll({
    where: { is_active: true },
    include: [{
      model: CurriculumStandard,
      as: 'curriculumStandards',
      where: gradeLevel ? { grade_level: gradeLevel } : {},
      required: false,
    }],
  });

  const result = [];
  for (const subject of subjects) {
    const enrolled = await CourseEnrollment.count({
      where: {
        subject_id: subject.id,
        semester,
        school_year: schoolYear,
        status: 'registered',
      },
    });

    // Tìm max_capacity từ curriculum_standard
    const cs = subject.curriculumStandards?.[0];
    const maxCapacity = cs?.max_capacity || 50; // mặc định 50

    result.push({
      subject_id: subject.id,
      subject_code: subject.code,
      subject_name: subject.name,
      enrolled_count: enrolled,
      max_capacity: maxCapacity,
      available: enrolled < maxCapacity,
    });
  }

  return result;
};

/**
 * Đăng ký môn tự chọn (Transaction Lock chống Over-enrollment).
 * TC15: Race Condition — chỉ 1 HS thành công khi cùng đăng ký ô cuối.
 */
const registerCourse = async (studentId, subjectId, semester, schoolYear) => {
  const t = await sequelize.transaction({
    isolationLevel: sequelize.Transaction.ISOLATION_LEVELS.SERIALIZABLE,
  });

  try {
    // Kiểm tra đã đăng ký chưa
    const existing = await CourseEnrollment.findOne({
      where: { student_id: studentId, subject_id: subjectId, semester, school_year: schoolYear, status: 'registered' },
      transaction: t,
    });
    if (existing) {
      await t.rollback();
      return { success: false, message: 'Đã đăng ký môn này rồi', code: 409 };
    }

    // Đếm sĩ số hiện tại (lock row)
    const enrolled = await CourseEnrollment.count({
      where: { subject_id: subjectId, semester, school_year: schoolYear, status: 'registered' },
      transaction: t,
      lock: true,
    });

    // Tìm max_capacity
    const cs = await CurriculumStandard.findOne({
      where: { subject_id: subjectId, semester, school_year: schoolYear },
      transaction: t,
    });
    const maxCapacity = cs?.max_capacity || 50;

    if (enrolled >= maxCapacity) {
      await t.rollback();
      return { success: false, message: `Lớp đã đầy (${enrolled}/${maxCapacity})`, code: 409 };
    }

    // Đăng ký
    const enrollment = await CourseEnrollment.create({
      student_id: studentId,
      subject_id: subjectId,
      semester,
      school_year: schoolYear,
      status: 'registered',
    }, { transaction: t });

    await t.commit();
    return { success: true, data: enrollment, message: 'Đăng ký thành công' };
  } catch (err) {
    await t.rollback();
    // Nếu là serialization failure → trả 409
    if (err.name === 'SequelizeUniqueConstraintError' || err.parent?.code === '40001') {
      return { success: false, message: 'Xung đột đăng ký, vui lòng thử lại', code: 409 };
    }
    throw err;
  }
};

/** Hủy đăng ký */
const dropCourse = async (studentId, subjectId, semester, schoolYear) => {
  const enrollment = await CourseEnrollment.findOne({
    where: { student_id: studentId, subject_id: subjectId, semester, school_year: schoolYear, status: 'registered' },
  });
  if (!enrollment) throw new Error('Không tìm thấy đăng ký');

  await enrollment.update({ status: 'dropped' });
  return enrollment;
};

module.exports = { listElectiveCourses, registerCourse, dropCourse };
