/**
 * Cron job: Tự động khóa grading periods khi qua lock_date.
 * Chạy mỗi giờ: 0 * * * *
 */
const cron = require('node-cron');
const { GradingPeriod, Score } = require('../src/models');
const { Op } = require('sequelize');

const startScoreLockCron = () => {
  cron.schedule('0 * * * *', async () => {
    try {
      const now = new Date();
      // Tìm các grading periods đã quá hạn nhưng chưa khóa
      const periods = await GradingPeriod.findAll({
        where: {
          lock_date: { [Op.lte]: now },
          is_locked: false,
        },
      });

      for (const period of periods) {
        // Khóa kỳ
        await period.update({ is_locked: true });

        // Chuyển tất cả draft → published cho kỳ này
        const [updated] = await Score.update(
          { status: 'published', published_at: now },
          {
            where: {
              semester: period.semester,
              school_year: period.school_year,
              status: 'draft',
            },
          }
        );

        console.log(`[ScoreLock] Khóa kỳ "${period.name}": ${updated} điểm draft → published`);
      }
    } catch (err) {
      console.error('[ScoreLock] Lỗi:', err.message);
    }
  });

  console.log('[ScoreLock] Cron job started (every hour)');
};

module.exports = { startScoreLockCron };
