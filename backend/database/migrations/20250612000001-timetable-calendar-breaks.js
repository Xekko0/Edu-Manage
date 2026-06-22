'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = await queryInterface.describeTable('timetable_configs');

    const addDate = async (name) => {
      if (!table[name]) {
        await queryInterface.addColumn('timetable_configs', name, {
          type: Sequelize.DATEONLY,
          allowNull: true,
        });
      }
    };

    await addDate('semester1_start');
    await addDate('semester1_end');
    await addDate('semester2_start');
    await addDate('semester2_end');

    if (!table.holidays) {
      await queryInterface.addColumn('timetable_configs', 'holidays', {
        type: Sequelize.JSON,
        allowNull: true,
      });
    }

    if (!table.morning_break_after_period) {
      await queryInterface.addColumn('timetable_configs', 'morning_break_after_period', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 2,
      });
    }
    if (!table.morning_break_minutes) {
      await queryInterface.addColumn('timetable_configs', 'morning_break_minutes', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20,
      });
    }
    if (!table.afternoon_break_after_period) {
      await queryInterface.addColumn('timetable_configs', 'afternoon_break_after_period', {
        type: Sequelize.INTEGER,
        allowNull: true,
      });
    }
    if (!table.afternoon_break_minutes) {
      await queryInterface.addColumn('timetable_configs', 'afternoon_break_minutes', {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 20,
      });
    }
  },

  async down(queryInterface) {
    const cols = [
      'semester1_start', 'semester1_end', 'semester2_start', 'semester2_end',
      'holidays',
      'morning_break_after_period', 'morning_break_minutes',
      'afternoon_break_after_period', 'afternoon_break_minutes',
    ];
    for (const col of cols) {
      try {
        await queryInterface.removeColumn('timetable_configs', col);
      } catch {
        /* column may not exist */
      }
    }
  },
};
