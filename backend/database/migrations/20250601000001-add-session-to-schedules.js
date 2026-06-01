'use strict';

/** Thêm ca sáng/chiều + ràng buộc unique theo ô lớp. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('schedules', 'session', {
      type: Sequelize.ENUM('morning', 'afternoon'),
      allowNull: false,
      defaultValue: 'morning',
    });

    await queryInterface.sequelize.query(
      "UPDATE schedules SET session = 'morning' WHERE session IS NULL",
    );

    try {
      await queryInterface.removeIndex('schedules', ['class_id', 'day_of_week', 'period']);
    } catch {
      /* index name may differ */
    }

    await queryInterface.addIndex(
      'schedules',
      ['class_id', 'school_year', 'day_of_week', 'session', 'period'],
      {
        unique: true,
        name: 'schedules_class_slot_unique',
      },
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('schedules', 'schedules_class_slot_unique');
    await queryInterface.addIndex('schedules', ['class_id', 'day_of_week', 'period']);
    await queryInterface.removeColumn('schedules', 'session');
  },
};
