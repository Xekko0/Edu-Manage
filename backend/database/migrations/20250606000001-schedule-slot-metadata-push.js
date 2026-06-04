'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('rooms', 'campus', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    await queryInterface.addColumn('schedules', 'room_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'rooms', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });

    await queryInterface.addColumn('schedules', 'delivery_mode', {
      type: Sequelize.STRING(10),
      allowNull: false,
      defaultValue: 'offline',
    });

    await queryInterface.addColumn('schedules', 'online_meeting_url', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('schedules', 'lesson_topic', {
      type: Sequelize.STRING(200),
      allowNull: true,
    });

    await queryInterface.addColumn('schedules', 'homework_reminder', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('timetable_configs', 'period_times', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.createTable('push_subscriptions', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      endpoint: { type: Sequelize.TEXT, allowNull: false },
      p256dh: { type: Sequelize.STRING(255), allowNull: false },
      auth: { type: Sequelize.STRING(255), allowNull: false },
      user_agent: { type: Sequelize.STRING(255), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('push_subscriptions', ['user_id', 'endpoint'], {
      unique: true,
      name: 'push_subscriptions_user_endpoint',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('push_subscriptions');
    await queryInterface.removeColumn('timetable_configs', 'period_times');
    await queryInterface.removeColumn('schedules', 'homework_reminder');
    await queryInterface.removeColumn('schedules', 'lesson_topic');
    await queryInterface.removeColumn('schedules', 'online_meeting_url');
    await queryInterface.removeColumn('schedules', 'delivery_mode');
    await queryInterface.removeColumn('schedules', 'room_id');
    await queryInterface.removeColumn('rooms', 'campus');
  },
};
