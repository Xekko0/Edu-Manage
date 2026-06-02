/**
 * Nhận diện câu hỏi về thời khóa biểu (dùng chung family + staff fallback).
 */
const normalize = (text) =>
  (text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd');

const SCHEDULE_QUESTION_RE =
  /lịch học|lich hoc|thời khóa biểu|thoi khoa bieu|\btkb\b|xem tkb|tiết học|tiet hoc|tuần này|tuan nay|hôm nay học|hom nay hoc|hom nay con hoc|học môn gì|hoc mon gi|cho xem.*lich|xem.*lich|xem.*tkb|doc tkb/;

const isScheduleQuestion = (message) => SCHEDULE_QUESTION_RE.test(normalize(message));

/** GV hỏi lịch *cá nhân* dạy — khác TKB đầy đủ của lớp. */
const MY_TEACHING_SCHEDULE_RE =
  /cua toi|của tôi|toi day|tôi dạy|lich day cua toi|lịch dạy của tôi|tkb cua toi|tkb của tôi/;

const isMyTeachingScheduleQuestion = (message) =>
  MY_TEACHING_SCHEDULE_RE.test(normalize(message));

module.exports = { isScheduleQuestion, isMyTeachingScheduleQuestion, normalize };
