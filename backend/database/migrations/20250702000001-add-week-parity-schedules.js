'use strict';

/**
 * Thêm week_parity vào schedules: all (mặc định), even (tuần chẵn), odd (tuần lẻ).
 * SQLite: recreate table. PostgreSQL: ALTER TYPE.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      await queryInterface.sequelize.query(
        "CREATE TYPE \"enum_schedules_week_parity\" AS VALUES ('all', 'even', 'odd')"
      );
      await queryInterface.addColumn('schedules', 'week_parity', {
        type: Sequelize.ENUM('all', 'even', 'odd'),
        defaultValue: 'all',
        allowNull: false,
      });
    } else {
      // SQLite: thêm cột trực tiếp (SQLite không thực thi ENUM)
      const tableDesc = await queryInterface.describeTable('schedules');
      if (!tableDesc.week_parity) {
        await queryInterface.addColumn('schedules', 'week_parity', {
          type: Sequelize.STRING(10),
          defaultValue: 'all',
          allowNull: false,
        });
      }
    }

    await queryInterface.addIndex('schedules', ['class_id', 'day_of_week', 'session', 'period', 'week_parity'], {
      name: 'schedules_slot_week_parity_idx',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('schedules', 'week_parity');
  },
};
