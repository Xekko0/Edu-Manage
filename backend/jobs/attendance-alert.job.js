/**
 * Cron job: Gửi cảnh báo vắng sau 15 phút (Smart Attendance Digest).
 * Chạy mỗi 5 phút (cron: 0/5 * * * *)
 */
const cron = require('node-cron');
const { PendingAttendanceAlert, Student, User } = require('../src/models');
const { sendAbsenceAlert } = require('../src/services/email.service');
const { Op } = require('sequelize');

const DELAY_MINUTES = 15;

const startAttendanceAlertCron = () => {
  cron.schedule('*/5 * * * *', async () => {
    try {
      const cutoff = new Date(Date.now() - DELAY_MINUTES * 60 * 1000);

      // Tìm alerts pending quá 15 phút
      const alerts = await PendingAttendanceAlert.findAll({
        where: {
          status: 'pending',
          marked_at: { [Op.lte]: cutoff },
        },
        include: [{ model: Student, as: 'student', include: [{ model: User, as: 'parents' }] }],
      });

      for (const alert of alerts) {
        try {
          // Gửi email cho mỗi PH
          const parents = alert.student?.parents || [];
          for (const parent of parents) {
            if (parent.email) {
              await sendAbsenceAlert(parent.email, alert.student?.student_code || 'HS', alert.attendance_date);
            }
          }

          // Tạo in-app notification
          // (có thể mở rộng sau)

          await alert.update({ status: 'sent' });
          console.log(`[AttendanceAlert] Đã gửi cảnh báo cho HS #${alert.student_id} ngày ${alert.attendance_date}`);
        } catch (err) {
          console.error(`[AttendanceAlert] Lỗi gửi alert #${alert.id}:`, err.message);
        }
      }
    } catch (err) {
      console.error('[AttendanceAlert] Lỗi cron:', err.message);
    }
  });

  console.log('[AttendanceAlert] Cron job started (every 5 minutes, delay 15 min)');
};

module.exports = { startAttendanceAlertCron };
