'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('room_assets', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      room_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'rooms', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      asset_name: { type: Sequelize.STRING(200), allowNull: false },
      quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
      condition: {
        type: Sequelize.ENUM('good', 'needs_repair', 'broken'),
        defaultValue: 'good',
      },
      notes: { type: Sequelize.STRING(255) },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      deleted_at: { type: Sequelize.DATE },
    });
    await queryInterface.addIndex('room_assets', ['room_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('room_assets');
  },
};
