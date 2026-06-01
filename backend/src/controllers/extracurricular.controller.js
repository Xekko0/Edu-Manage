const { Extracurricular, Student } = require('../models');
const { success, error } = require('../utils/responseHelper');

const list = async (_req, res) => {
  try {
    const items = await Extracurricular.findAll({ order: [['start_date', 'DESC']] });
    return success(res, items);
  } catch (err) {
    return error(res, 'Lỗi tải hoạt động', 500, err.message);
  }
};

const listByStudent = async (req, res) => {
  try {
    const { student_id } = req.params;
    const student = await Student.findByPk(student_id, {
      include: [{
        model: Extracurricular,
        as: 'activities',
        through: { attributes: ['attended'] },
      }],
    });
    if (!student) return error(res, 'Không tìm thấy học sinh', 404);
    return success(res, student.activities || []);
  } catch (err) {
    return error(res, 'Lỗi tải hoạt động', 500, err.message);
  }
};

module.exports = { list, listByStudent };
