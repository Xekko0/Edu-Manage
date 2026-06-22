'use strict';

/** Gán program_component theo GDPT 2018 cho môn học demo. */
const COMPONENT_BY_CODE = {
  TOAN: 'required_core',
  VAN: 'required_core',
  ANH: 'required_core',
  SU: 'required_core',
  TD: 'required_core',
  GDQP: 'required_core',
  HTTN: 'required_activity',
  TRUNG: 'optional_elective',
  PHAP: 'optional_elective',
  NGA: 'optional_elective',
  NHAT: 'optional_elective',
  HAN: 'optional_elective',
  VLY: 'elective',
  HOA: 'elective',
  SINH: 'elective',
  DIA: 'elective',
  GDKTPL: 'elective',
  CN: 'elective',
  TIN: 'elective',
  AMNHAC: 'elective',
  MTHUAT: 'elective',
};

module.exports = {
  async up(queryInterface, Sequelize) {
    const subjects = await queryInterface.sequelize.query(
      'SELECT id, code FROM subjects',
      { type: Sequelize.QueryTypes.SELECT },
    );
    for (const s of subjects) {
      const comp = COMPONENT_BY_CODE[s.code] || 'elective';
      await queryInterface.sequelize.query(
        'UPDATE subjects SET program_component = ? WHERE id = ?',
        { replacements: [comp, s.id] },
      );
    }
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(
      "UPDATE subjects SET program_component = 'elective'",
    );
  },
};
