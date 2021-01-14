const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/dbConnect');

module.exports = sequelize.define('userList', {
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
