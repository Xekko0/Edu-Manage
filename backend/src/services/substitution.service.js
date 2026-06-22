/**
 * Substitution service — Đề xuất dạy thay tự động.
 * Khi GV bận đột xuất, quét GV cùng bộ môn → chấm điểm → top 3.
 */
const { Op } = require('sequelize');
const { Schedule, TeacherAssignment, TeacherUnavailability, User } = require('../models');

/**
 * Tìm GV thay thế cho 1 tiết bị ảnh hưởng.
 * @param {number} scheduleId - ID tiết bị ảnh hưởng
 * @param {number} schoolYear - Năm học
 * @returns {Array} Top 3 GV thay thế phù hợp
 */
const findSubstitutes = async (scheduleId, schoolYear) => {
  // 1. Lấy thông tin tiết bị ảnh hưởng
  const slot = await Schedule.findByPk(scheduleId, {
    include: [
      { model: User, as: 'teacher', attributes: ['id', 'full_name'] },
    ],
  });
  if (!slot) throw new Error('Không tìm thấy tiết học');

  const { subject_id, class_id, day_of_week, session, period, semester } = slot;

  // 2. Tìm tất cả GV dạy cùng môn (trừ GV bận)
  const assignments = await TeacherAssignment.findAll({
    where: {
      subject_id,
      is_active: true,
      teacher_id: { [Op.ne]: slot.teacher_id },
      ...(schoolYear ? { school_year: schoolYear } : {}),
    },
    include: [{ model: User, as: 'teacher', attributes: ['id', 'full_name', 'email'] }],
  });

  const candidateIds = [...new Set(assignments.map((a) => a.teacher_id))];

  if (candidateIds.length === 0) return [];

  // 3. Loại trừ GV trùng tiết (hard constraint)
  const conflictingSlots = await Schedule.findAll({
    where: {
      day_of_week,
      session,
      period,
      semester,
      teacher_id: { [Op.in]: candidateIds },
      ...(schoolYear ? { school_year: schoolYear } : {}),
    },
    attributes: ['teacher_id'],
  });

  const busyTeacherIds = new Set(conflictingSlots.map((s) => s.teacher_id));

  // 4. Loại trừ GV bận đột xuất (teacher_unavailability)
  const unavailabilities = await TeacherUnavailability.findAll({
    where: {
      teacher_id: { [Op.in]: candidateIds },
      day_of_week,
      session,
      period,
      ...(schoolYear ? { school_year: schoolYear } : {}),
    },
    attributes: ['teacher_id'],
  });

  unavailabilities.forEach((u) => busyTeacherIds.add(u.teacher_id));

  // 5. Lọc GV khả thi
  const availableIds = candidateIds.filter((id) => !busyTeacherIds.has(id));

  if (availableIds.length === 0) return [];

  // 6. Chấm điểm soft: ưu tiên GV trống tiết trước/sau (tránh gap)
  const candidates = [];

  for (const teacherId of availableIds) {
    // Đếm số tiết trống liền kề (trước + sau tiết này)
    const adjacentSlots = await Schedule.count({
      where: {
        teacher_id: teacherId,
        day_of_week,
        semester,
        session,
        period: { [Op.in]: [period - 1, period + 1].filter((p) => p >= 1 && p <= 5) },
        ...(schoolYear ? { school_year: schoolYear } : {}),
      },
    });

    // Điểm: tiết liền kề = 0 → tốt (không tạo gap), tiết liền kề = 2 → xấu
    const gapScore = 2 - adjacentSlots; // 0, 1, hoặc 2

    // Bonus: GV đã dạy lớp này trước đó
    const taughtThisClass = assignments.find(
      (a) => a.teacher_id === teacherId && a.class_id === class_id
    );
    const classBonus = taughtThisClass ? 1 : 0;

    const totalScore = gapScore + classBonus;

    const teacher = assignments.find((a) => a.teacher_id === teacherId)?.teacher;

    candidates.push({
      teacher_id: teacherId,
      teacher_name: teacher?.full_name || 'N/A',
      teacher_email: teacher?.email || '',
      score: totalScore,
      reason: [
        adjacentSlots === 0 ? 'Trống tiết liền kề' : `${adjacentSlots} tiết liền kề`,
        classBonus ? 'Đã dạy lớp này' : null,
      ].filter(Boolean),
    });
  }

  // 7. Sắp xếp theo điểm (thấp = tốt hơn) → top 3
  candidates.sort((a, b) => a.score - b.score);
  return candidates.slice(0, 3);
};

module.exports = { findSubstitutes };
