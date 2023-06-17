const Sequelize = require('sequelize');
const config = require('../config/config');

const db = {};

const sequelize = new Sequelize(
  config.development.database,
  config.development.username,
  config.development.password,
  {
    dialect: config.development.dialect,
    host: config.development.host,
  },
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// 모델 가져오기
db.User = require('./user')(sequelize, Sequelize);
db.Post = require('./post')(sequelize, Sequelize);

db.User.hasMany(db.Post);
db.Post.belongsTo(db.User, { foreignKey: 'user_id', targetKey: 'id' });

module.exports = db;
