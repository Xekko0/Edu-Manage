'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('notifications', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      title: { type: Sequelize.STRING(200), allowNull: false },
      body: { type: Sequelize.TEXT, allowNull: false },
      type: {
        type: Sequelize.ENUM('system', 'score', 'attendance', 'event', 'message'),
        defaultValue: 'system',
      },
      is_read: { type: Sequelize.BOOLEAN, defaultValue: false },
      email_sent: { type: Sequelize.BOOLEAN, defaultValue: false },
      metadata: { type: Sequelize.TEXT }, // JSON string (SQLite không có JSONB)
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('notifications', ['user_id', 'is_read']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('notifications');
  },
};
