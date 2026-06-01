/**
 * Homeroom middleware — kiểm tra GVCN có chủ nhiệm lớp đang thao tác không.
 * Admin bypass. Class_id lấy từ body / params / query, hoặc gián tiếp qua student_id.
 *
 * Cách dùng:
 *   router.post('/class/:class_id/journal', auth, role('homeroom','admin'), homeroom, ctrl.foo);
 */
const { Class, Student } = require('../models');
const { error } = require('../utils/responseHelper');

const resolveClassId = async (req) => {
  let class_id = req.body.class_id || req.params.class_id || req.query.class_id;
  if (class_id) return parseInt(class_id, 10);

  // Suy ra từ student_id (điểm danh bulk: items[0])
  let student_id = req.body.student_id || req.params.student_id || req.query.student_id;
  if (!student_id && Array.isArray(req.body.items) && req.body.items[0]?.student_id) {
    student_id = req.body.items[0].student_id;
  }
  if (student_id) {
    const st = await Student.findByPk(student_id);
    return st?.class_id || null;
  }
  return null;
};

const homeroom = async (req, res, next) => {
  try {
    if (req.user.role === 'admin') return next();

    const class_id = await resolveClassId(req);
    if (!class_id) return error(res, 'Thiếu class_id hoặc student_id để kiểm tra quyền GVCN', 400);

    const cls = await Class.findByPk(class_id);
    if (!cls) return error(res, 'Không tìm thấy lớp', 404);

    const isHomeroom = Number(cls.homeroom_teacher_id) === Number(req.user.id);
    // #region agent log
    fetch('http://127.0.0.1:7598/ingest/50d32c58-c803-483c-84ed-d5e16a0a5512',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'c24510'},body:JSON.stringify({sessionId:'c24510',location:'homeroom.middleware.js',message:'homeroom check',data:{class_id,userId:req.user.id,homeroomTeacherId:cls.homeroom_teacher_id,isHomeroom},timestamp:Date.now(),hypothesisId:'H2'})}).catch(()=>{});
    // #endregion
    if (!isHomeroom) {
      return error(res, 'Bạn không phải GVCN của lớp này', 403);
    }
    req.homeroomClass = cls;
    next();
  } catch (err) {
    return error(res, 'Lỗi kiểm tra GVCN', 500, err.message);
  }
};

module.exports = homeroom;
module.exports.resolveClassId = resolveClassId;
