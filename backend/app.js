/**
 * EduSmart Backend — Entry point
 * Khởi tạo Express, kết nối DB, đăng ký routes & middleware toàn cục.
 */
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./src/config/env');
const sequelize = require('./src/config/database');
const { TimetableConfig } = require('./src/models');
const rateLimitMiddleware = require('./src/middleware/rateLimit.middleware');
const readonlyMiddleware = require('./src/middleware/readonly.middleware');

const authRoutes = require('./src/routes/auth.routes');
const userRoutes = require('./src/routes/user.routes');
const studentRoutes = require('./src/routes/student.routes');
const scoreRoutes = require('./src/routes/score.routes');
const assignmentRoutes = require('./src/routes/assignment.routes');
const scheduleRoutes = require('./src/routes/schedule.routes');
const timetableConfigRoutes = require('./src/routes/timetable-config.routes');
const curriculumRoutes = require('./src/routes/curriculum.routes');
const roomRoutes = require('./src/routes/room.routes');
const pushRoutes = require('./src/routes/push.routes');
const { startScheduleReminderCron } = require('./jobs/schedule-reminder.job');
const { startScoreLockCron } = require('./jobs/score-lock.job');
const { startAttendanceAlertCron } = require('./jobs/attendance-alert.job');
const attendanceRoutes = require('./src/routes/attendance.routes');
const reportRoutes = require('./src/routes/report.routes');
const notificationRoutes = require('./src/routes/notification.routes');
const chatRoutes = require('./src/routes/chat.routes');
const subjectRoutes = require('./src/routes/subject.routes');
const classRoutes = require('./src/routes/class.routes');
const tuitionRoutes = require('./src/routes/tuition.routes');
const journalRoutes = require('./src/routes/journal.routes');
const evaluationRoutes = require('./src/routes/evaluation.routes');
const extracurricularRoutes = require('./src/routes/extracurricular.routes');
const ewsRoutes = require('./src/routes/ews.routes');
const competencyRoutes = require('./src/routes/competency.routes');
const inviteRoutes = require('./src/routes/invite.routes');
const searchRoutes = require('./src/routes/search.routes');
const gradingPeriodRoutes = require('./src/routes/grading-period.routes');
const icalRoutes = require('./src/routes/ical.routes');
const financeRoutes = require('./src/routes/finance.routes');
const examRoutes = require('./src/routes/exam.routes');
const courseRegistrationRoutes = require('./src/routes/course-registration.routes');

const app = express();

/** Hỗ trợ nhiều origin (phân tách bằng dấu phẩy) + luôn cho phép Vite local. */
const parseCorsOrigins = () => {
  const list = (env.FRONTEND_URL || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
  ['http://localhost:5173', 'http://127.0.0.1:5173'].forEach((o) => {
    if (!list.includes(o)) list.push(o);
  });
  return list;
};

const corsOrigins = parseCorsOrigins();

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      const allowed = !origin || corsOrigins.includes(origin);
      if (allowed) return callback(null, true);
      callback(new Error(`CORS: origin ${origin} not allowed`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));
app.use(rateLimitMiddleware);

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'EduSmart API v1.1' }));

// Chặn write methods với HS/PH trên toàn bộ /api (trừ các endpoint trắng trong middleware)
app.use('/api', readonlyMiddleware);

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/timetable-config', timetableConfigRoutes);
app.use('/api/curriculum-standards', curriculumRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/push', pushRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/subjects', subjectRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/tuitions', tuitionRoutes);
app.use('/api/journals', journalRoutes);
app.use('/api/evaluations', evaluationRoutes);
app.use('/api/extracurriculars', extracurricularRoutes);
app.use('/api/ews', ewsRoutes);
app.use('/api/competencies', competencyRoutes);
app.use('/api/invite', inviteRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/grading-periods', gradingPeriodRoutes);
app.use('/api/ical', icalRoutes);
app.use('/api/finance', financeRoutes);
app.use('/api/exam', examRoutes);
app.use('/api/courses', courseRegistrationRoutes);
// Substitution endpoint mount trong schedules routes
const substitutionCtrl = require('./src/controllers/substitution.controller');
app.get('/api/schedules/:id/substitutes', require('./src/middleware/auth.middleware'), substitutionCtrl.getSubstitutes);

// Global error handler — luôn trả JSON tiếng Việt
app.use((err, _req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Lỗi máy chủ nội bộ',
  });
});

const PORT = env.PORT || 3001;

(async () => {
  try {
    await sequelize.authenticate();
    await TimetableConfig.sync();
    const scheduleService = require('./src/services/schedule.service');
    await scheduleService.purgeGhostSchedules();
    const dialect = sequelize.getDialect();
    console.log(`[DB] Kết nối ${dialect.toUpperCase()} thành công`);
    startScheduleReminderCron();
    startScoreLockCron();
    startAttendanceAlertCron();
    app.listen(PORT, () => console.log(`[APP] EduSmart backend chạy trên cổng ${PORT}`));
  } catch (err) {
    console.error('[DB] Không kết nối được database:', err.message);
    process.exit(1);
  }
})();

module.exports = app;
