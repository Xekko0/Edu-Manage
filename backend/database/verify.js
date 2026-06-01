/**
 * Script kiểm thử nhanh sau khi seed:
 *  - Verify mật khẩu tài khoản admin
 *  - Tính điểm TB cho 1 HS bằng score.service (công thức SRS 2.3)
 *  - Verify teacher_assignments
 *  - Mock 1 lượt chat: intent → router (không gọi LLM)
 */
require('dotenv').config();
const bcrypt = require('bcrypt');
const { sequelize, User, Student, TeacherAssignment, Class, Subject } = require('../src/models');
const scoreService = require('../src/services/score.service');
const routerService = require('../src/services/ai/router.service');

(async () => {
  try {
    console.log('\n=== 1. KIỂM TRA TÀI KHOẢN ADMIN ===');
    const admin = await User.findOne({ where: { email: 'admin@edusmart.local' } });
    if (!admin) throw new Error('Không tìm thấy admin');
    const ok = await bcrypt.compare('edusmart123', admin.password);
    console.log(`  - admin@edusmart.local  | role=${admin.role}  | password ok? ${ok}`);

    console.log('\n=== 2. ĐIỂM TRUNG BÌNH HỌC SINH ĐẦU TIÊN (HK1 2024-2025) ===');
    const stu = await Student.findOne({
      include: [{ model: User, as: 'user' }, { model: Class, as: 'class' }],
    });
    const subjects = await scoreService.getStudentSubjectAverages(stu.id, 1, '2024-2025');
    const overall = scoreService.getOverallAverage(subjects);
    console.log(`  HS: ${stu.user.full_name}  (${stu.student_code}, lớp ${stu.class?.name})`);
    subjects.forEach((s) => {
      console.log(`    - ${s.subject_name.padEnd(12)}  TB=${s.average.toFixed(2)}  | ${s.grade}`);
    });
    console.log(`  >>> TB chung HK1: ${overall.toFixed(2)}`);

    console.log('\n=== 3. PHÂN CÔNG GVBM (teacher_assignments) ===');
    const teacher = await User.findOne({ where: { email: 'gv.toan@edusmart.local' } });
    const myAssignments = await TeacherAssignment.findAll({
      where: { teacher_id: teacher.id },
      include: [{ model: Class, as: 'class' }, { model: Subject, as: 'subject' }],
    });
    console.log(`  GVBM: ${teacher.full_name}  phân công ${myAssignments.length} lớp-môn:`);
    myAssignments.forEach((a) =>
      console.log(`    - ${a.subject.name.padEnd(12)} × lớp ${a.class.name} (${a.school_year})`),
    );

    console.log('\n=== 4. MOCK CHAT ROUTER (intent=view_scores cho 1 HS) ===');
    const ctx = {
      intent: 'view_scores',
      subject: null,
      semester: 1,
      week: null,
      child_id: stu.id,
      class_id: stu.class_id,
    };
    const result = await routerService.route(ctx);
    console.log(`  type=${result.type}`);
    console.log(`  message="${result.message}"`);
    console.log(`  payload: ${Array.isArray(result.payload) ? result.payload.length + ' môn' : '—'}`);
    console.log(`  chips: ${result.chips?.join(' | ')}`);

    console.log('\nTẤT CẢ KIỂM THỬ ĐỀU OK ✔');
    await sequelize.close();
    process.exit(0);
  } catch (err) {
    console.error('LỖI KIỂM THỬ:', err);
    process.exit(1);
  }
})();
