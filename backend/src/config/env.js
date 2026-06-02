/**
 * Tập trung biến môi trường + cảnh báo nếu thiếu.
 */
require('dotenv').config();

const required = ['DATABASE_URL', 'JWT_SECRET'];
required.forEach((k) => {
  if (!process.env[k]) {
    console.warn(`[ENV] Thiếu biến môi trường: ${k}`);
  }
});

if (!process.env.ANTHROPIC_API_KEY && !process.env.GEMINI_API_KEY) {
  console.warn('[ENV] Chưa cấu hình AI — chat dùng nhận diện từ khóa (rules). Thêm ANTHROPIC_API_KEY hoặc GEMINI_API_KEY.');
}

module.exports = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT, 10) || 3001,
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  CURRENT_SCHOOL_YEAR: process.env.CURRENT_SCHOOL_YEAR || '2024-2025',

  DATABASE_URL: process.env.DATABASE_URL,

  JWT_SECRET: process.env.JWT_SECRET,
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
  JWT_ACCESS_EXPIRES: process.env.JWT_ACCESS_EXPIRES || '1h',
  JWT_REFRESH_EXPIRES: process.env.JWT_REFRESH_EXPIRES || '7d',

  AI_PROVIDER: process.env.AI_PROVIDER || 'anthropic',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: parseInt(process.env.SMTP_PORT, 10) || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
  SMTP_FROM: process.env.SMTP_FROM || 'EduSmart <no-reply@edusmart.local>',
};
