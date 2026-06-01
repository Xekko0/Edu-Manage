'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('chat_sessions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      session_token: { type: Sequelize.STRING(100), allowNull: false, unique: true },
      messages: { type: Sequelize.TEXT, defaultValue: '[]' }, // JSON string
      total_tokens: { type: Sequelize.INTEGER, defaultValue: 0 },
      ended_at: { type: Sequelize.DATE },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('chat_sessions', ['user_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('chat_sessions');
  },
};
