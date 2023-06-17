const Sequelize = require('sequelize');

module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'post',
    {
      post_id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      title: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      content: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      photos: {
        type: Sequelize.JSON, // 사진 파일 정보를 저장하기 위한 JSON 형식
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      username: {
        type: Sequelize.STRING(20),
        allowNull: true,
      },
    },
    {
      sequelize,
      timestamps: false,
      underscored: false,
      modelName: 'Post',
      tableName: 'posts',
      paranoid: false,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    },
  );
