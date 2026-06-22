'use strict';

/**
 * Học kỳ trên khung CT / phân công / TKB — tách HK1 vs HK2 (môn 1,5 tiết/năm → 2+1).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const addSemester = async (table) => {
      const desc = await queryInterface.describeTable(table);
      if (!desc.semester) {
        await queryInterface.addColumn(table, 'semester', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        });
      }
    };

    await addSemester('curriculum_standards');
    await addSemester('teacher_assignments');
    await addSemester('schedules');

    const tryRemove = async (table, name) => {
      try {
        await queryInterface.removeIndex(table, name);
      } catch {
        /* chưa có */
      }
    };

    await tryRemove('curriculum_standards', 'curriculum_standards_unique');
    await queryInterface.addIndex(
      'curriculum_standards',
      ['school_year', 'grade_level', 'subject_id', 'semester'],
      { unique: true, name: 'curriculum_standards_unique' },
    );

    await tryRemove('teacher_assignments', 'uniq_teacher_class_subject_year');
    await queryInterface.addIndex(
      'teacher_assignments',
      ['teacher_id', 'class_id', 'subject_id', 'school_year', 'semester'],
      { unique: true, name: 'uniq_teacher_class_subject_year_sem' },
    );

    await tryRemove('schedules', 'schedules_class_slot_unique');
    await tryRemove('schedules', 'schedules_teacher_slot_unique');
    await queryInterface.addIndex(
      'schedules',
      ['class_id', 'school_year', 'semester', 'day_of_week', 'session', 'period'],
      { unique: true, name: 'schedules_class_slot_unique' },
    );
    await queryInterface.addIndex(
      'schedules',
      ['teacher_id', 'school_year', 'semester', 'day_of_week', 'session', 'period'],
      { unique: true, name: 'schedules_teacher_slot_unique' },
    );

    /** TKB cũ (semester=0) gán vào HK1 để admin xếp lại HK2 riêng. */
    await queryInterface.sequelize.query(
      'UPDATE schedules SET semester = 1 WHERE semester = 0',
    );
  },

  async down(queryInterface) {
    const tryRemove = async (table, name) => {
      try {
        await queryInterface.removeIndex(table, name);
      } catch { /* ignore */ }
    };

    await tryRemove('schedules', 'schedules_teacher_slot_unique');
    await tryRemove('schedules', 'schedules_class_slot_unique');
    await queryInterface.addIndex(
      'schedules',
      ['class_id', 'school_year', 'day_of_week', 'session', 'period'],
      { unique: true, name: 'schedules_class_slot_unique' },
    );
    await queryInterface.addIndex(
      'schedules',
      ['teacher_id', 'school_year', 'day_of_week', 'session', 'period'],
      { unique: true, name: 'schedules_teacher_slot_unique' },
    );

    await tryRemove('teacher_assignments', 'uniq_teacher_class_subject_year_sem');
    await queryInterface.addIndex(
      'teacher_assignments',
      ['teacher_id', 'class_id', 'subject_id', 'school_year'],
      { unique: true, name: 'uniq_teacher_class_subject_year' },
    );

    await tryRemove('curriculum_standards', 'curriculum_standards_unique');
    await queryInterface.addIndex(
      'curriculum_standards',
      ['school_year', 'grade_level', 'subject_id'],
      { unique: true, name: 'curriculum_standards_unique' },
    );

    for (const table of ['schedules', 'teacher_assignments', 'curriculum_standards']) {
      const desc = await queryInterface.describeTable(table);
      if (desc.semester) await queryInterface.removeColumn(table, 'semester');
    }
  },
};
