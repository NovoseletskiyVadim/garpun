const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('userList', {
    userLogin: {
      type: DataTypes.STRING,
    },
    userPassword: {
      type: DataTypes.STRING,
    },
    userRole: {
      type: DataTypes.STRING,
    },
    chatID: {
      type: DataTypes.NUMBER,
    },
    chatMsgOn: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  });
};
