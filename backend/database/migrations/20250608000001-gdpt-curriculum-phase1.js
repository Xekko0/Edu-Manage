'use strict';

/** GDPT 2018 Phase 1: khung CT theo tiết/năm, phân loại môn, tiết 45 phút. */
module.exports = {
  async up(queryInterface, Sequelize) {
    const cs = await queryInterface.describeTable('curriculum_standards');
    if (!cs.total_periods_per_year) {
      await queryInterface.addColumn('curriculum_standards', 'total_periods_per_year', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
    if (!cs.teaching_weeks) {
      await queryInterface.addColumn('curriculum_standards', 'teaching_weeks', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 35,
      });
    }

    await queryInterface.sequelize.query(
      `UPDATE curriculum_standards
       SET total_periods_per_year = periods_per_week * COALESCE(teaching_weeks, 35),
           teaching_weeks = COALESCE(teaching_weeks, 35)
       WHERE total_periods_per_year IS NULL`,
    );

    const sub = await queryInterface.describeTable('subjects');
    if (!sub.program_component) {
      await queryInterface.addColumn('subjects', 'program_component', {
        type: Sequelize.STRING(30),
        allowNull: false,
        defaultValue: 'elective',
      });
    }

    const tc = await queryInterface.describeTable('timetable_configs');
    if (!tc.period_duration_minutes) {
      await queryInterface.addColumn('timetable_configs', 'period_duration_minutes', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 45,
      });
    }
    if (!tc.grade_10_annual_periods) {
      await queryInterface.addColumn('timetable_configs', 'grade_10_annual_periods', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1015,
      });
    }
    if (!tc.grade_11_annual_periods) {
      await queryInterface.addColumn('timetable_configs', 'grade_11_annual_periods', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1032,
      });
    }
    if (!tc.grade_12_annual_periods) {
      await queryInterface.addColumn('timetable_configs', 'grade_12_annual_periods', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1032,
      });
    }

    const sch = await queryInterface.describeTable('schedules');
    if (!sch.program_component) {
      await queryInterface.addColumn('schedules', 'program_component', {
        type: Sequelize.STRING(30),
        allowNull: true,
      });
    }
  },

  async down(queryInterface) {
    const safeRemove = async (table, col) => {
      const desc = await queryInterface.describeTable(table);
      if (desc[col]) await queryInterface.removeColumn(table, col);
    };
    await safeRemove('schedules', 'program_component');
    await safeRemove('timetable_configs', 'grade_12_annual_periods');
    await safeRemove('timetable_configs', 'grade_11_annual_periods');
    await safeRemove('timetable_configs', 'grade_10_annual_periods');
    await safeRemove('timetable_configs', 'period_duration_minutes');
    await safeRemove('subjects', 'program_component');
    await safeRemove('curriculum_standards', 'teaching_weeks');
    await safeRemove('curriculum_standards', 'total_periods_per_year');
  },
};
