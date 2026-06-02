const { formatFeaturesText } = require('../../../ai/staff-data.service');
const { HOW_TO_GUIDES } = require('../../../ai/staff-capabilities');

const help_features = async (ctx) => {
  const feats = ctx.capabilities.features || [];
  return {
    type: 'help',
    message: formatFeaturesText(ctx.capabilities),
    payload: feats,
    chips: ['Cách nhập điểm', 'Danh sách lớp', 'Điểm lớp HK1'],
    chip_actions: feats.slice(0, 4).map((f) => ({ label: f.label, path: f.path })),
  };
};

const how_to = async (ctx) => {
  const guide = HOW_TO_GUIDES[ctx.topic] || HOW_TO_GUIDES.score_entry;
  return {
    type: 'help',
    message: `📖 Hướng dẫn:\n${guide}`,
    payload: { topic: ctx.topic },
    chips: ['Tôi có thể làm gì?', 'Danh sách học sinh', 'Điểm lớp'],
  };
};

const list_classes = async (ctx) => {
  const lines = ctx.accessible_classes.map(
    (c) => `• ${c.name} (khối ${c.grade_level})${ctx.homeroom_classes.some((h) => h.id === c.id) ? ' — GVCN' : ''}`,
  );
  return {
    type: 'classes',
    message: ctx.user_role === 'admin'
      ? `Các lớp trong hệ thống:\n${lines.join('\n') || 'Chưa có lớp.'}`
      : `Lớp bạn liên quan:\n${lines.join('\n') || 'Chưa được phân công.'}`,
    payload: ctx.accessible_classes,
    chips: ['Danh sách học sinh', 'Điểm lớp', 'Cách nhập điểm'],
  };
};

const link_parent_guide = async () => ({
  type: 'help',
  message: `📖 Liên kết Phụ huynh:\n${HOW_TO_GUIDES.link_parent || HOW_TO_GUIDES.parents}`,
  payload: { path: '/teacher/parents' },
  chips: ['Danh sách học sinh', 'Tôi có thể làm gì?', 'Điểm lớp HK1'],
});

const create_student_guide = async (ctx) => ({
  type: 'help',
  message: `📖 Tạo / quản lý học sinh:\n${HOW_TO_GUIDES.students}`,
  payload: { path: ctx.persona === 'admin' ? '/admin/students' : '/teacher/students' },
  chips: ['Tôi có thể làm gì?', 'Liên kết PH', 'Danh sách lớp'],
});

const handlers = {
  help_features,
  how_to,
  list_classes,
  link_parent_guide,
  create_student_guide,
};

module.exports = {
  toolId: 'staff.help',
  audience: 'staff',
  intents: Object.keys(handlers),
  handlers,
};
