/**
 * Khai báo associations giữa các model.
 * Bảng parent_student được tạo tự động bằng belongsToMany (PH ↔ HS nhiều–nhiều).
 */
const sequelize = require('../config/database');

const User = require('./User');
const Student = require('./Student');
const Class = require('./Class');
const Subject = require('./Subject');
const TeacherAssignment = require('./TeacherAssignment');
const Score = require('./Score');
const Schedule = require('./Schedule');
const Attendance = require('./Attendance');
const Notification = require('./Notification');
const Extracurricular = require('./Extracurricular');
const StudentActivity = require('./StudentActivity');
const ChatSession = require('./ChatSession');
const Tuition = require('./Tuition');
const TuitionPayment = require('./TuitionPayment');
const ClassJournal = require('./ClassJournal');
const Evaluation = require('./Evaluation');

// User ↔ Student (1-1)
User.hasOne(Student, { foreignKey: 'user_id', as: 'studentProfile' });
Student.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Class ↔ Student (1-n)
Class.hasMany(Student, { foreignKey: 'class_id', as: 'students' });
Student.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });

// GVCN: User ↔ Class (1-n) qua homeroom_teacher_id
User.hasMany(Class, { foreignKey: 'homeroom_teacher_id', as: 'homeroomClasses' });
Class.belongsTo(User, { foreignKey: 'homeroom_teacher_id', as: 'homeroomTeacher' });

// Phụ huynh ↔ Học sinh (n-n) — bảng nối parent_student
User.belongsToMany(Student, {
  through: 'parent_student',
  foreignKey: 'parent_id',
  otherKey: 'student_id',
  as: 'children',
});
Student.belongsToMany(User, {
  through: 'parent_student',
  foreignKey: 'student_id',
  otherKey: 'parent_id',
  as: 'parents',
});

// Teacher Assignment
TeacherAssignment.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
TeacherAssignment.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
TeacherAssignment.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
User.hasMany(TeacherAssignment, { foreignKey: 'teacher_id', as: 'assignments' });

// Score
Score.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Score.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
Score.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
Score.belongsTo(User, { foreignKey: 'entered_by', as: 'enteredBy' });
Student.hasMany(Score, { foreignKey: 'student_id', as: 'scores' });

// Schedule
Schedule.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
Schedule.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
Schedule.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });

// Attendance
Attendance.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Attendance.belongsTo(Schedule, { foreignKey: 'schedule_id', as: 'schedule' });

// Notification
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// Extracurricular ↔ Student (n-n)
Extracurricular.belongsToMany(Student, {
  through: StudentActivity,
  foreignKey: 'activity_id',
  otherKey: 'student_id',
  as: 'students',
});
Student.belongsToMany(Extracurricular, {
  through: StudentActivity,
  foreignKey: 'student_id',
  otherKey: 'activity_id',
  as: 'activities',
});

// Chat Session
ChatSession.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(ChatSession, { foreignKey: 'user_id', as: 'chatSessions' });

// Tuition
Tuition.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
Class.hasMany(Tuition, { foreignKey: 'class_id', as: 'tuitions' });

// Tuition Payment
TuitionPayment.belongsTo(Tuition, { foreignKey: 'tuition_id', as: 'tuition' });
TuitionPayment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Tuition.hasMany(TuitionPayment, { foreignKey: 'tuition_id', as: 'payments' });
Student.hasMany(TuitionPayment, { foreignKey: 'student_id', as: 'tuitionPayments' });

// Class Journal — Sổ đầu bài
ClassJournal.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
ClassJournal.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
ClassJournal.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
Class.hasMany(ClassJournal, { foreignKey: 'class_id', as: 'journals' });

// Evaluation
Evaluation.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Evaluation.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
Evaluation.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
Student.hasMany(Evaluation, { foreignKey: 'student_id', as: 'evaluations' });

module.exports = {
  sequelize,
  User,
  Student,
  Class,
  Subject,
  TeacherAssignment,
  Score,
  Schedule,
  Attendance,
  Notification,
  Extracurricular,
  StudentActivity,
  ChatSession,
  Tuition,
  TuitionPayment,
  ClassJournal,
  Evaluation,
};
