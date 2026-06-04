'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('rooms', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      code: { type: Sequelize.STRING(30), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(100), allowNull: false },
      room_type: {
        type: Sequelize.STRING(20),
        allowNull: false,
        defaultValue: 'classroom',
      },
      capacity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 40 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.createTable('curriculum_standards', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      school_year: { type: Sequelize.STRING(9), allowNull: false },
      grade_level: { type: Sequelize.INTEGER, allowNull: false },
      subject_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'subjects', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      periods_per_week: { type: Sequelize.INTEGER, allowNull: false },
      is_required: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex(
      'curriculum_standards',
      ['school_year', 'grade_level', 'subject_id'],
      { unique: true, name: 'curriculum_standards_unique' },
    );

    await queryInterface.addColumn('subjects', 'preferred_room_type', {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('subjects', 'preferred_room_type');
    await queryInterface.dropTable('curriculum_standards');
    await queryInterface.dropTable('rooms');
  },
};
