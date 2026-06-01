/**
 * Config dành riêng cho Sequelize CLI (migrate / seed).
 * Đọc DATABASE_URL từ .env và build object phù hợp.
 */
require('dotenv').config();
const path = require('path');

const url = process.env.DATABASE_URL || 'sqlite:./database/edusmart.sqlite';
const isSqlite = url.startsWith('sqlite:');

const buildConfig = () => {
  if (isSqlite) {
    const storage = url.replace(/^sqlite:/, '');
    return {
      dialect: 'sqlite',
      storage: storage === ':memory:' ? ':memory:' : path.resolve(__dirname, '..', '..', storage),
      logging: false,
    };
  }
  return {
    url,
    dialect: 'postgres',
    logging: false,
  };
};

const cfg = buildConfig();

module.exports = {
  development: cfg,
  test: cfg,
  production: cfg,
};
