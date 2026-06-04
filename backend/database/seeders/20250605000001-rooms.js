'use strict';

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    const rooms = [
      { code: 'P101', name: 'Phòng 10A1', room_type: 'classroom', capacity: 45, campus: 'Cơ sở chính', is_active: true, created_at: now, updated_at: now },
      { code: 'P102', name: 'Phòng 10A2', room_type: 'classroom', capacity: 45, campus: 'Cơ sở chính', is_active: true, created_at: now, updated_at: now },
      { code: 'P111', name: 'Phòng 11A1', room_type: 'classroom', capacity: 45, campus: 'Cơ sở chính', is_active: true, created_at: now, updated_at: now },
      { code: 'LAB1', name: 'Phòng thí nghiệm Hóa', room_type: 'lab', capacity: 30, is_active: true, created_at: now, updated_at: now },
      { code: 'TIN1', name: 'Phòng Tin học 1', room_type: 'computer', capacity: 35, is_active: true, created_at: now, updated_at: now },
      { code: 'TD1', name: 'Sân / phòng Thể dục', room_type: 'gym', capacity: 60, is_active: true, created_at: now, updated_at: now },
    ];
    await queryInterface.bulkInsert('rooms', rooms);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('rooms', null, {});
  },
};
