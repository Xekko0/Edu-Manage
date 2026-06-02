/**

 * Điều phối AI Chat — 5 persona: admin, gvcn, gvbm, parent, student.

 * Luồng: rules (intent) → dispatcher (tool) → LLM chỉ general_chat / ai_advice.

 */

const { Class } = require('../../models');

const intentService = require('./intent.service');

const contextService = require('./context.service');

const staffIntentService = require('./staff-intent.service');

const staffContextService = require('./staff-context.service');

const dispatcher = require('../chat/dispatcher.service');

const { getResponseMode } = require('../chat/registry');

const { enforceChatScope } = require('../../middleware/chatScope.middleware');

const llm = require('./llm.service');



const PERSONAS = Object.freeze(['admin', 'gvcn', 'gvbm', 'parent', 'student']);

const FAMILY_PERSONAS = ['parent', 'student'];

const STAFF_PERSONAS = ['admin', 'gvcn', 'gvbm'];



const isHomeroomTeacher = async (userId) => {

  const count = await Class.count({

    where: { homeroom_teacher_id: userId, is_active: true },

  });

  return count > 0;

};



/** Map user DB role → persona SRS */

const resolvePersona = async (user) => {

  const { role, id } = user;

  if (role === 'admin') return 'admin';

  if (role === 'parent') return 'parent';

  if (role === 'student') return 'student';

  if (role === 'homeroom') return 'gvcn';

  if (role === 'subject') {

    const hr = await isHomeroomTeacher(id);

    return hr ? 'gvcn' : 'gvbm';

  }

  return null;

};



const getCapabilitiesForPersona = (persona) => {

  const map = {

    admin: [

      'Thống kê toàn trường',

      'Quản lý user, HS, lớp, phân công, TKB, học phí',

      'Hướng dẫn thao tác admin',

      'Hội thoại tự do (cần API key)',

    ],

    gvcn: [

      'Lớp chủ nhiệm: HS, PH, điểm danh, báo cáo lớp',

      'Nhập điểm môn được phân công',

      'Hướng dẫn liên kết PH, tạo HS',

      'Hội thoại tự do (cần API key)',

    ],

    gvbm: [

      'Lớp-môn được phân công',

      'Nhập điểm, sổ đầu bài, đánh giá môn',

      'Không điểm danh / quản lý PH (GVCN)',

      'Hội thoại tự do (cần API key)',

    ],

    parent: [

      'Điểm, lịch, học phí, nhận xét của con',

      'Điểm danh, ngoại khóa, thông báo',

      'Tư vấn học tập (cần API key)',

    ],

    student: [

      'Điểm, lịch, học phí, nhận xét bản thân',

      'Điểm danh, ngoại khóa, thông báo',

      'Tư vấn học tập (cần API key)',

    ],

  };

  return map[persona] || [];

};



const stripMeta = (wrapped) => {

  if (!wrapped?.meta) return wrapped;

  const { meta, ...result } = wrapped;

  return { result, meta };

};



const handleMessage = async (user, { message, chatHistory, student_id, class_id }) => {

  const persona = await resolvePersona(user);

  if (!persona) {

    throw Object.assign(new Error('Vai trò không hỗ trợ AI Widget'), { statusCode: 403 });

  }



  let intent;

  let wrapped;

  let activeClassId = null;

  const audience = FAMILY_PERSONAS.includes(persona) ? 'family' : 'staff';

  const dispatchOptions = { userMessage: message, chatHistory, persona };



  if (STAFF_PERSONAS.includes(persona)) {

    intent = await staffIntentService.detectStaffIntent(message, user.role, persona);

    const ctx = await staffContextService.injectStaffContext(intent, user, {

      class_id,

      student_id,

      userMessage: message,

      persona,

    });

    activeClassId = ctx.active_class_id;

    dispatchOptions.persona = persona;



    const scopeBlock = enforceChatScope(persona, intent);

    wrapped = scopeBlock

      ? dispatcher.wrapScopeBlock(scopeBlock, intent)

      : await dispatcher.dispatchStaff(ctx, dispatchOptions);

  } else {

    intent = await intentService.detectIntent(message);

    const ctx = await contextService.injectContext(intent, user, { student_id });

    if (!ctx.child_id) {

      throw Object.assign(new Error('Không tìm thấy hồ sơ học sinh để trả lời'), { statusCode: 404 });

    }

    dispatchOptions.userRole = user.role;

    wrapped = await dispatcher.dispatchFamily(ctx, dispatchOptions);

  }



  const { result, meta } = stripMeta(wrapped);



  return {

    persona,

    audience,

    intent,

    result,

    meta,

    activeClassId,

    intent_source: intent.source || 'rules',

    ai_mode: getResponseMode(intent.intent, llm.isConfigured()),

  };

};



module.exports = {

  PERSONAS,

  FAMILY_PERSONAS,

  STAFF_PERSONAS,

  resolvePersona,

  getCapabilitiesForPersona,

  handleMessage,

  isHomeroomTeacher,

};

