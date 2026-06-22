/**
 * Competency service — quản lý khung năng lực và gán nhãn điểm.
 */
const { Competency, ScoreCompetencyTag, Score, Subject } = require('../models');

/** Lấy danh sách năng lực */
const listCompetencies = async (filters = {}) => {
  const where = { is_active: true };
  if (filters.category) where.category = filters.category;
  return Competency.findAll({ where, order: [['category', 'ASC'], ['code', 'ASC']] });
};

/** Gán nhãn năng lực cho 1 đầu điểm */
const tagScore = async (scoreId, competencyId, proficiencyLevel = 'developing') => {
  return ScoreCompetencyTag.upsert({
    score_id: scoreId,
    competency_id: competencyId,
    proficiency_level: proficiencyLevel,
  });
};

/** Gán nhãn hàng loạt (cho bulkEnter) */
const tagScoresBulk = async (tags) => {
  // tags: [{ score_id, competency_id, proficiency_level }]
  if (!tags || tags.length === 0) return [];
  return ScoreCompetencyTag.bulkCreate(tags, { updateOnDuplicate: ['proficiency_level'] });
};

/** Lấy profile năng lực của 1 HS */
const getStudentCompetencyProfile = async (studentId, semester, schoolYear) => {
  const tags = await ScoreCompetencyTag.findAll({
    include: [
      {
        model: Score, as: 'score',
        where: { student_id: studentId, semester, school_year: schoolYear },
        attributes: ['subject_id', 'score_type', 'score_value'],
        include: [{ model: Subject, as: 'subject', attributes: ['name'] }],
      },
      { model: Competency, as: 'competency', attributes: ['id', 'code', 'name', 'category'] },
    ],
  });

  // Group by competency
  const grouped = {};
  tags.forEach((t) => {
    const cid = t.competency_id;
    if (!grouped[cid]) {
      grouped[cid] = {
        competency: t.competency,
        levels: [],
        scores: [],
      };
    }
    grouped[cid].levels.push(t.proficiency_level);
    grouped[cid].scores.push({
      subject: t.score?.subject?.name,
      score_type: t.score?.score_type,
      score_value: Number(t.score?.score_value),
      level: t.proficiency_level,
    });
  });

  // Tính proficiency level trung bình cho mỗi competency
  const levelMap = { beginner: 1, developing: 2, proficient: 3, advanced: 4 };
  const levelNames = ['', 'beginner', 'developing', 'proficient', 'advanced'];

  return Object.values(grouped).map(({ competency, levels, scores }) => {
    const avgLevel = levels.reduce((sum, l) => sum + (levelMap[l] || 2), 0) / levels.length;
    return {
      competency_id: competency.id,
      competency_code: competency.code,
      competency_name: competency.name,
      category: competency.category,
      proficiency_level: levelNames[Math.round(avgLevel)] || 'developing',
      score_count: scores.length,
      details: scores,
    };
  });
};

module.exports = {
  listCompetencies,
  tagScore,
  tagScoresBulk,
  getStudentCompetencyProfile,
};
