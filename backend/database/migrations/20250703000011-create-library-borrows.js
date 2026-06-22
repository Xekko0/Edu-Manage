'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('library_borrows', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      student_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'students', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      book_title: { type: Sequelize.STRING(300), allowNull: false },
      book_isbn: { type: Sequelize.STRING(20) },
      borrow_date: { type: Sequelize.DATEONLY, allowNull: false },
      due_date: { type: Sequelize.DATEONLY, allowNull: false },
      return_date: { type: Sequelize.DATEONLY },
      status: {
        type: Sequelize.ENUM('borrowed', 'returned', 'overdue'),
        allowNull: false,
        defaultValue: 'borrowed',
      },
      notes: { type: Sequelize.STRING(255) },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('library_borrows', ['student_id']);
    await queryInterface.addIndex('library_borrows', ['status', 'due_date']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('library_borrows');
  },
};
