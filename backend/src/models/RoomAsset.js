/**
 * Bảng room_assets — Trang thiết bị phòng học.
 */
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoomAsset = sequelize.define('RoomAsset', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  room_id: { type: DataTypes.INTEGER, allowNull: false },
  asset_name: { type: DataTypes.STRING(200), allowNull: false },
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  condition: {
    type: DataTypes.ENUM('good', 'needs_repair', 'broken'),
    defaultValue: 'good',
  },
  notes: { type: DataTypes.STRING(255) },
}, {
  tableName: 'room_assets',
});

module.exports = RoomAsset;
