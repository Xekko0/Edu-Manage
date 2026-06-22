'use strict';

/**
 * Thêm trạng thái 'late' (đi muộn) vào ENUM status của bảng attendance.
 * SQLite không hỗ trợ ALTER TYPE → phải tạo bảng tạm, copy data, drop cũ, rename.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dialect = queryInterface.sequelize.getDialect();

    if (dialect === 'postgres') {
      // PostgreSQL: dùng ALTER TYPE
      await queryInterface.sequelize.query(
        "ALTER TYPE \"enum_attendance_status\" ADD VALUE IF NOT EXISTS 'late'"
      );
    } else {
      // SQLite: recreate table
      await queryInterface.sequelize.query(`
        CREATE TABLE attendance_new (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE ON UPDATE CASCADE,
          schedule_id INTEGER REFERENCES schedules(id) ON DELETE SET NULL ON UPDATE CASCADE,
          attendance_date DATEONLY NOT NULL,
          status VARCHAR(20) NOT NULL DEFAULT 'present',
          note VARCHAR(255),
          marked_by INTEGER REFERENCES users(id),
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          deleted_at DATETIME
        )
      `);
      await queryInterface.sequelize.query(`
        INSERT INTO attendance_new SELECT * FROM attendance
      `);
      await queryInterface.sequelize.query('DROP TABLE attendance');
      await queryInterface.sequelize.query('ALTER TABLE attendance_new RENAME TO attendance');
      await queryInterface.sequelize.query(
        'CREATE INDEX attendance_student_id_attendance_date ON attendance(student_id, attendance_date)'
      );
    }
  },

  async down() {
    // Không rollback vì có thể mất data
  },
};
