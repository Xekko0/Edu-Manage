/**
 * Sequelize instance dùng chung cho toàn bộ backend.
 * Tự động detect dialect từ DATABASE_URL:
 *   - sqlite:./database/edusmart.sqlite  → SQLite (dev/demo)
 *   - postgresql://user:pass@host/db     → PostgreSQL (production)
 */
const path = require('path');
const { Sequelize } = require('sequelize');
const env = require('./env');

const url = env.DATABASE_URL || 'sqlite:./database/edusmart.sqlite';
const isSqlite = url.startsWith('sqlite:');

let sequelize;

if (isSqlite) {
  const storage = url.replace(/^sqlite:/, '');
  const absoluteStorage =
    storage === ':memory:' ? ':memory:' : path.resolve(__dirname, '..', '..', storage);
  sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: absoluteStorage,
    logging: env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
    },
  });
} else {
  sequelize = new Sequelize(url, {
    dialect: 'postgres',
    logging: env.NODE_ENV === 'development' ? console.log : false,
    define: {
      timestamps: true,
      underscored: true,
      paranoid: true,
    },
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  });
}

module.exports = sequelize;
