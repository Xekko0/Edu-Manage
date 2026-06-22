'use strict';

/**
 * Danh mục môn THPT theo GDPT 2018:
 * - 7 môn/hoạt động bắt buộc (gồm NN1, GDTC, GDQPAN, HTTN)
 * - 9 môn lựa chọn (HS chọn 4) — thay GDCD bằng GDKTPL
 * - Các ngoại ngữ thay thế (Tiếng Trung, Pháp, Nga, Nhật, Hàn)
 */
const SCHOOL_YEAR = '2024-2025';
const TEACHING_WEEKS = 35;

/** @type {Array<{code:string,name:string,program_component:string,preferred_room_type:string|null,is_active?:boolean}>} */
const SUBJECTS = [
  { code: 'TOAN', name: 'Toán', program_component: 'required_core', preferred_room_type: 'classroom' },
  { code: 'VAN', name: 'Ngữ văn', program_component: 'required_core', preferred_room_type: 'classroom' },
  { code: 'ANH', name: 'Tiếng Anh (Ngoại ngữ 1)', program_component: 'required_core', preferred_room_type: 'classroom' },
  { code: 'SU', name: 'Lịch sử', program_component: 'required_core', preferred_room_type: 'classroom' },
  { code: 'TD', name: 'Giáo dục thể chất', program_component: 'required_core', preferred_room_type: 'gym' },
  { code: 'GDQP', name: 'Giáo dục quốc phòng và an ninh', program_component: 'required_core', preferred_room_type: 'classroom' },
  { code: 'HTTN', name: 'Hoạt động trải nghiệm, hướng nghiệp', program_component: 'required_activity', preferred_room_type: 'classroom' },
  { code: 'TRUNG', name: 'Tiếng Trung (Ngoại ngữ 1)', program_component: 'optional_elective', preferred_room_type: 'classroom' },
  { code: 'PHAP', name: 'Tiếng Pháp (Ngoại ngữ 1)', program_component: 'optional_elective', preferred_room_type: 'classroom' },
  { code: 'NGA', name: 'Tiếng Nga (Ngoại ngữ 1)', program_component: 'optional_elective', preferred_room_type: 'classroom' },
  { code: 'NHAT', name: 'Tiếng Nhật (Ngoại ngữ 1)', program_component: 'optional_elective', preferred_room_type: 'classroom' },
  { code: 'HAN', name: 'Tiếng Hàn (Ngoại ngữ 1)', program_component: 'optional_elective', preferred_room_type: 'classroom' },
  { code: 'VLY', name: 'Vật lí', program_component: 'elective', preferred_room_type: 'lab' },
  { code: 'HOA', name: 'Hóa học', program_component: 'elective', preferred_room_type: 'lab' },
  { code: 'SINH', name: 'Sinh học', program_component: 'elective', preferred_room_type: 'lab' },
  { code: 'DIA', name: 'Địa lí', program_component: 'elective', preferred_room_type: 'classroom' },
  { code: 'GDKTPL', name: 'Giáo dục kinh tế và pháp luật', program_component: 'elective', preferred_room_type: 'classroom' },
  { code: 'TIN', name: 'Tin học', program_component: 'elective', preferred_room_type: 'computer' },
  { code: 'CN', name: 'Công nghệ', program_component: 'elective', preferred_room_type: 'classroom' },
  { code: 'AMNHAC', name: 'Âm nhạc', program_component: 'elective', preferred_room_type: 'special' },
  { code: 'MTHUAT', name: 'Mĩ thuật', program_component: 'elective', preferred_room_type: 'special' },
];

/** Tiết/năm theo GDPT (35 tuần). */
const ANNUAL_BY_CODE = {
  TOAN: 105,
  VAN: 105,
  ANH: 105,
  SU: 52,
  TD: 70,
  GDQP: 35,
  HTTN: 35,
  TRUNG: 105,
  PHAP: 105,
  NGA: 105,
  NHAT: 105,
  HAN: 105,
  VLY: 70,
  HOA: 70,
  SINH: 70,
  DIA: 70,
  GDKTPL: 52,
  TIN: 70,
  CN: 70,
  AMNHAC: 35,
  MTHUAT: 35,
};

const REQUIRED_CODES = new Set([
  'TOAN', 'VAN', 'ANH', 'SU', 'TD', 'GDQP', 'HTTN',
]);

const upsertSubject = async (queryInterface, Sequelize, row) => {
  const now = new Date();
  const desc = `Môn ${row.name} — chương trình GDPT THPT`;
  const existing = await queryInterface.sequelize.query(
    'SELECT id FROM subjects WHERE code = ?',
    { replacements: [row.code], type: Sequelize.QueryTypes.SELECT },
  );
  if (existing[0]) {
    await queryInterface.sequelize.query(
      `UPDATE subjects SET name = ?, description = ?, program_component = ?,
       preferred_room_type = ?, is_active = ?, updated_at = ? WHERE code = ?`,
      {
        replacements: [
          row.name,
          desc,
          row.program_component,
          row.preferred_room_type,
          row.is_active !== false,
          now,
          row.code,
        ],
      },
    );
    return existing[0].id;
  }
  await queryInterface.bulkInsert('subjects', [{
    code: row.code,
    name: row.name,
    description: desc,
    program_component: row.program_component,
    preferred_room_type: row.preferred_room_type,
    is_active: row.is_active !== false,
    created_at: now,
    updated_at: now,
  }]);
  const inserted = await queryInterface.sequelize.query(
    'SELECT id FROM subjects WHERE code = ?',
    { replacements: [row.code], type: Sequelize.QueryTypes.SELECT },
  );
  return inserted[0].id;
};

const upsertCurriculum = async (queryInterface, Sequelize, subjectId, code) => {
  const total = ANNUAL_BY_CODE[code];
  if (!total) return;
  const periods_per_week = Math.round(total / TEACHING_WEEKS);
  const is_required = REQUIRED_CODES.has(code);
  const now = new Date();

  for (const grade_level of [10, 11, 12]) {
    const existing = await queryInterface.sequelize.query(
      `SELECT id FROM curriculum_standards
       WHERE school_year = ? AND grade_level = ? AND subject_id = ? AND semester = 0`,
      {
        replacements: [SCHOOL_YEAR, grade_level, subjectId],
        type: Sequelize.QueryTypes.SELECT,
      },
    );
    const row = {
      school_year: SCHOOL_YEAR,
      grade_level,
      subject_id: subjectId,
      semester: 0,
      total_periods_per_year: total,
      teaching_weeks: TEACHING_WEEKS,
      periods_per_week,
      is_required,
      updated_at: now,
    };
    if (existing[0]) {
      await queryInterface.sequelize.query(
        `UPDATE curriculum_standards SET total_periods_per_year = ?, teaching_weeks = ?,
         periods_per_week = ?, is_required = ?, updated_at = ? WHERE id = ?`,
        {
          replacements: [
            total, TEACHING_WEEKS, periods_per_week, is_required, now, existing[0].id,
          ],
        },
      );
    } else {
      await queryInterface.bulkInsert('curriculum_standards', [{
        ...row,
        created_at: now,
      }]);
    }
  }
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const idsByCode = {};
    for (const row of SUBJECTS) {
      idsByCode[row.code] = await upsertSubject(queryInterface, Sequelize, row);
    }

    for (const [code, subjectId] of Object.entries(idsByCode)) {
      await upsertCurriculum(queryInterface, Sequelize, subjectId, code);
    }

    await queryInterface.sequelize.query(
      "UPDATE subjects SET is_active = 0, updated_at = ? WHERE code = 'GDCD'",
      { replacements: [new Date()] },
    );
    const gdcd = await queryInterface.sequelize.query(
      "SELECT id FROM subjects WHERE code = 'GDCD'",
      { type: Sequelize.QueryTypes.SELECT },
    );
    if (gdcd[0]) {
      await queryInterface.bulkDelete('curriculum_standards', {
        school_year: SCHOOL_YEAR,
        subject_id: gdcd[0].id,
      }, {});
    }
  },

  async down(queryInterface, Sequelize) {
    const codes = ['GDQP', 'HTTN', 'GDKTPL', 'AMNHAC', 'MTHUAT', 'TRUNG', 'PHAP', 'NGA', 'NHAT', 'HAN'];
    for (const code of codes) {
      const rows = await queryInterface.sequelize.query(
        'SELECT id FROM subjects WHERE code = ?',
        { replacements: [code], type: Sequelize.QueryTypes.SELECT },
      );
      if (rows[0]) {
        await queryInterface.bulkDelete('curriculum_standards', { subject_id: rows[0].id }, {});
        await queryInterface.bulkDelete('subjects', { code }, {});
      }
    }
    await queryInterface.sequelize.query(
      "UPDATE subjects SET is_active = 1, name = 'Giáo dục công dân' WHERE code = 'GDCD'",
    );
    await queryInterface.sequelize.query(
      "UPDATE subjects SET name = 'Thể dục' WHERE code = 'TD'",
    );
  },
};
