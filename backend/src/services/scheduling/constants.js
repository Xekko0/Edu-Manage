'use strict';

const MAX_PERIODS_PER_SESSION = 5;
const MAX_PERIODS_PER_WEEK = parseInt(process.env.TEACHER_MAX_PERIODS_WEEK, 10) || 20;

module.exports = {
  MAX_PERIODS_PER_SESSION,
  MAX_PERIODS_PER_WEEK,
};
