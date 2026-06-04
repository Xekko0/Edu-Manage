'use strict';

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ROOM_TYPES = ['classroom', 'lab', 'computer', 'gym', 'special'];

const Room = sequelize.define('Room', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  code: { type: DataTypes.STRING(30), allowNull: false, unique: true },
  name: { type: DataTypes.STRING(100), allowNull: false },
  room_type: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'classroom',
    validate: { isIn: [ROOM_TYPES] },
  },
  capacity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 40 },
  campus: { type: DataTypes.STRING(100), allowNull: true },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  tableName: 'rooms',
  underscored: true,
  paranoid: false,
});

Room.ROOM_TYPES = ROOM_TYPES;

module.exports = Room;
