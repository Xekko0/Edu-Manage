'use strict';

/** Gán program_component theo GDPT 2018 cho môn học demo. */
const COMPONENT_BY_CODE = {
  VAN: 'required_core',
  TOAN: 'required_core',
  ANH: 'required_core',
  SU: 'required_core',
  TD: 'required_core',
  GDCD: 'required_core',
  VLY: 'elective',
  HOA: 'elective',
  SINH: 'elective',
  DIA: 'elective',
  CN: 'elective',
  TIN: 'elective',
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
