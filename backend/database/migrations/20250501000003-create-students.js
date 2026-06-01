'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('students', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false, unique: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      student_code: { type: Sequelize.STRING(20), allowNull: false, unique: true },
      date_of_birth: { type: Sequelize.DATEONLY },
      gender: { type: Sequelize.ENUM('male', 'female', 'other') },
      address: { type: Sequelize.STRING(500) },
      class_id: {
        type: Sequelize.INTEGER,
        references: { model: 'classes', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'SET NULL',
      },
      enrollment_year: { type: Sequelize.INTEGER },
      is_active: { type: Sequelize.BOOLEAN, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('students', ['student_code']);
    await queryInterface.addIndex('students', ['class_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('students');
  },
};
