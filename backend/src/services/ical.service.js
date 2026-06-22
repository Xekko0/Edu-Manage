/**
 * iCal service — Sinh feed .ics theo chuẩn RFC 5545.
 * Mỗi GV/HS có URL .ics riêng để sync với Google/Apple/Outlook Calendar.
 */
const { Schedule, User, Student, Class, Subject, Room } = require('../models');

const DAY_OF_WEEK = ['', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7', 'CN'];

// Helper: format date sang iCal DTSTART/DTEND
const formatICalDate = (date, hours, minutes) => {
  const d = new Date(date);
  d.setHours(hours, minutes, 0, 0);
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(hours)}${pad(minutes)}00`;
};

// Helper: tính giờ bắt đầu/kết thúc tiết từ period
const getPeriodTimes = (period, periodDuration = 45, morningStart = 7) => {
  const startHour = morningStart + Math.floor((period - 1) * periodDuration / 60);
  const startMin = ((period - 1) * periodDuration) % 60;
  const endTotalMin = period * periodDuration;
  const endHour = morningStart + Math.floor(endTotalMin / 60);
  const endMin = endTotalMin % 60;
  return { startHour, startMin, endHour, endMin };
};

/**
 * Sinh iCal feed cho 1 user (GV hoặc HS).
 * @param {Array} schedules - Danh sách tiết học
 * @param {string} calName - Tên calendar
 * @returns {string} Nội dung .ics
 */
const generateICalFeed = (schedules, calName = 'EduSmart') => {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//EduSmart//Schedule//VN',
    `X-WR-CALNAME:${calName}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const now = new Date();
  const semesterStart = new Date(now.getFullYear(), 8, 1); // 01/09
  const semesterEnd = new Date(now.getFullYear() + 1, 0, 31); // 31/01

  for (const slot of schedules) {
    // Tính ngày cụ thể cho tiết này trong tuần hiện tại
    const today = new Date();
    const currentDay = today.getDay() || 7; // 1=Mon, 7=Sun
    const daysUntil = slot.day_of_week - currentDay;
    const slotDate = new Date(today);
    slotDate.setDate(today.getDate() + daysUntil);

    const { startHour, startMin, endHour, endMin } = getPeriodTimes(slot.period);

    const subjectName = slot.subject?.name || 'Học';
    const teacherName = slot.teacher?.full_name || '';
    const roomName = slot.room || slot.roomRef?.name || '';
    const isOnline = slot.delivery_mode === 'online';
    const onlineUrl = slot.online_meeting_url || '';

    const summary = `${subjectName}${teacherName ? ` - ${teacherName}` : ''}`;
    const location = isOnline ? 'Trực tuyến' : roomName;
    const description = [
      `Môn: ${subjectName}`,
      teacherName ? `GV: ${teacherName}` : null,
      roomName ? `Phòng: ${roomName}` : null,
      slot.lesson_topic ? `Chủ đề: ${slot.lesson_topic}` : null,
      slot.homework_reminder ? `Bài tập: ${slot.homework_reminder}` : null,
      onlineUrl ? `Link: ${onlineUrl}` : null,
    ].filter(Boolean).join('\\n');

    lines.push('BEGIN:VEVENT');
    lines.push(`DTSTART:${formatICalDate(slotDate, startHour, startMin)}`);
    lines.push(`DTEND:${formatICalDate(slotDate, endHour, endMin)}`);
    lines.push(`SUMMARY:${summary}`);
    if (location) lines.push(`LOCATION:${location}`);
    lines.push(`DESCRIPTION:${description}`);
    lines.push(`UID:edusmart-slot-${slot.id}@edusmart.local`);
    lines.push(`DTSTAMP:${formatICalDate(now, now.getHours(), now.getMinutes())}`);
    if (isOnline && onlineUrl) lines.push(`URL:${onlineUrl}`);
    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
};

/**
 * Sinh feed cho giáo viên.
 */
const generateTeacherFeed = async (teacherId) => {
  const schedules = await Schedule.findAll({
    where: { teacher_id: teacherId },
    include: [
      { model: Subject, as: 'subject', attributes: ['name'] },
      { model: User, as: 'teacher', attributes: ['full_name'] },
      { model: Class, as: 'class', attributes: ['name'] },
      { model: Room, as: 'roomRef', attributes: ['name'] },
    ],
    order: [['day_of_week', 'ASC'], ['period', 'ASC']],
  });

  const teacher = await User.findByPk(teacherId, { attributes: ['full_name'] });
  return generateICalFeed(schedules, `EduSmart - ${teacher?.full_name || 'GV'}`);
};

/**
 * Sinh feed cho học sinh.
 */
const generateStudentFeed = async (studentId) => {
  const student = await Student.findByPk(studentId, {
    include: [
      { model: Class, as: 'class', attributes: ['id', 'name'] },
      { model: User, as: 'user', attributes: ['full_name'] },
    ],
  });
  if (!student?.class_id) return generateICalFeed([], 'EduSmart');

  const schedules = await Schedule.findAll({
    where: { class_id: student.class_id },
    include: [
      { model: Subject, as: 'subject', attributes: ['name'] },
      { model: User, as: 'teacher', attributes: ['full_name'] },
      { model: Room, as: 'roomRef', attributes: ['name'] },
    ],
    order: [['day_of_week', 'ASC'], ['period', 'ASC']],
  });

  return generateICalFeed(schedules, `EduSmart - ${student.user?.full_name || 'HS'}`);
};

/**
 * Sinh feed cho lớp.
 */
const generateClassFeed = async (classId) => {
  const cls = await Class.findByPk(classId, { attributes: ['name'] });

  const schedules = await Schedule.findAll({
    where: { class_id: classId },
    include: [
      { model: Subject, as: 'subject', attributes: ['name'] },
      { model: User, as: 'teacher', attributes: ['full_name'] },
      { model: Room, as: 'roomRef', attributes: ['name'] },
    ],
    order: [['day_of_week', 'ASC'], ['period', 'ASC']],
  });

  return generateICalFeed(schedules, `EduSmart - Lớp ${cls?.name || classId}`);
};

module.exports = { generateICalFeed, generateTeacherFeed, generateStudentFeed, generateClassFeed };
