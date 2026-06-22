'use strict';

/**
 * Bảng score_audit_log — Nhật ký kiểm toán điểm số (không thể xóa).
 * Tự động ghi khi điểm số bị sửa.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('score_audit_log', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      score_id: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'scores', key: 'id' },
        onUpdate: 'CASCADE', onDelete: 'CASCADE',
      },
      old_value: { type: Sequelize.DECIMAL(4, 2) },
      new_value: { type: Sequelize.DECIMAL(4, 2), allowNull: false },
      modified_by: {
        type: Sequelize.INTEGER, allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      modified_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      reason: { type: Sequelize.TEXT },
    });
    await queryInterface.addIndex('score_audit_log', ['score_id']);
    await queryInterface.addIndex('score_audit_log', ['modified_at']);
    // Không có updated_at, deleted_at — bản ghi audit không thể sửa/xóa
  },

  async down(queryInterface) {
    await queryInterface.dropTable('score_audit_log');
  },
};
