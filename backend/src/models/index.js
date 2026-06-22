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
const TimetableConfig = require('./TimetableConfig');
const Room = require('./Room');
const CurriculumStandard = require('./CurriculumStandard');
const PushSubscription = require('./PushSubscription');
const TeacherUnavailability = require('./TeacherUnavailability');
const EWSRiskScore = require('./EWSRiskScore');
const Competency = require('./Competency');
const ScoreCompetencyTag = require('./ScoreCompetencyTag');
const GradingPeriod = require('./GradingPeriod');
const PendingAttendanceAlert = require('./PendingAttendanceAlert');
const ScoreAuditLog = require('./ScoreAuditLog');
const ExamPeriod = require('./ExamPeriod');
const Assessment = require('./Assessment');
const GradingScale = require('./GradingScale');
const Transcript = require('./Transcript');
const CourseEnrollment = require('./CourseEnrollment');
const Invoice = require('./Invoice');
const InvoiceItem = require('./InvoiceItem');
const PaymentTransaction = require('./PaymentTransaction');
const RoomAsset = require('./RoomAsset');
const LibraryBorrow = require('./LibraryBorrow');

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
TeacherUnavailability.belongsTo(User, { foreignKey: 'teacher_id', as: 'teacher' });
User.hasMany(TeacherUnavailability, { foreignKey: 'teacher_id', as: 'unavailability' });

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
Schedule.belongsTo(Room, { foreignKey: 'room_id', as: 'roomRef' });

PushSubscription.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
User.hasMany(PushSubscription, { foreignKey: 'user_id', as: 'pushSubscriptions' });

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

CurriculumStandard.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
Subject.hasMany(CurriculumStandard, { foreignKey: 'subject_id', as: 'curriculumStandards' });

// EWS Risk Score
EWSRiskScore.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Student.hasMany(EWSRiskScore, { foreignKey: 'student_id', as: 'riskScores' });

// Competency ↔ Score (n-n qua ScoreCompetencyTag)
Score.belongsToMany(Competency, { through: ScoreCompetencyTag, foreignKey: 'score_id', otherKey: 'competency_id', as: 'competencies' });
Competency.belongsToMany(Score, { through: ScoreCompetencyTag, foreignKey: 'competency_id', otherKey: 'score_id', as: 'scores' });
ScoreCompetencyTag.belongsTo(Score, { foreignKey: 'score_id', as: 'score' });
ScoreCompetencyTag.belongsTo(Competency, { foreignKey: 'competency_id', as: 'competency' });

// Pending Attendance Alert
PendingAttendanceAlert.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });

// === ERP: EXAM & GPA ENGINE ===

// Score Audit Log
ScoreAuditLog.belongsTo(Score, { foreignKey: 'score_id', as: 'score' });
ScoreAuditLog.belongsTo(User, { foreignKey: 'modified_by', as: 'modifier' });
Score.hasMany(ScoreAuditLog, { foreignKey: 'score_id', as: 'auditLogs' });

// Assessment
Assessment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Assessment.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
Assessment.belongsTo(Class, { foreignKey: 'class_id', as: 'class' });
Assessment.belongsTo(ExamPeriod, { foreignKey: 'exam_period_id', as: 'examPeriod' });
Assessment.belongsTo(User, { foreignKey: 'entered_by', as: 'enteredBy' });
Student.hasMany(Assessment, { foreignKey: 'student_id', as: 'assessments' });

// Transcript
Transcript.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Student.hasMany(Transcript, { foreignKey: 'student_id', as: 'transcripts' });

// Course Enrollment
CourseEnrollment.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
CourseEnrollment.belongsTo(Subject, { foreignKey: 'subject_id', as: 'subject' });
Student.hasMany(CourseEnrollment, { foreignKey: 'student_id', as: 'enrollments' });

// === ERP: FINANCE LEDGER ===

// Invoice
Invoice.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Invoice.belongsTo(User, { foreignKey: 'created_by', as: 'creator' });
Student.hasMany(Invoice, { foreignKey: 'student_id', as: 'invoices' });
Invoice.hasMany(InvoiceItem, { foreignKey: 'invoice_id', as: 'items' });
Invoice.hasMany(PaymentTransaction, { foreignKey: 'invoice_id', as: 'payments' });

// Invoice Item
InvoiceItem.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });

// Payment Transaction
PaymentTransaction.belongsTo(Invoice, { foreignKey: 'invoice_id', as: 'invoice' });
PaymentTransaction.belongsTo(User, { foreignKey: 'approved_by', as: 'approver' });

// === ERP: FACILITY & LIBRARY ===

// Room Asset
RoomAsset.belongsTo(Room, { foreignKey: 'room_id', as: 'room' });
Room.hasMany(RoomAsset, { foreignKey: 'room_id', as: 'assets' });

// Library Borrow
LibraryBorrow.belongsTo(Student, { foreignKey: 'student_id', as: 'student' });
Student.hasMany(LibraryBorrow, { foreignKey: 'student_id', as: 'libraryBorrows' });

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
  TimetableConfig,
  Room,
  CurriculumStandard,
  PushSubscription,
  TeacherUnavailability,
  EWSRiskScore,
  Competency,
  ScoreCompetencyTag,
  GradingPeriod,
  PendingAttendanceAlert,
  ScoreAuditLog,
  ExamPeriod,
  Assessment,
  GradingScale,
  Transcript,
  CourseEnrollment,
  Invoice,
  InvoiceItem,
  PaymentTransaction,
  RoomAsset,
  LibraryBorrow,
};
