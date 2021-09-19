const { DataTypes } = require('sequelize');
const { mainDbConnection } = require('../db/dbConnect');

module.exports = mainDbConnection.define('users', {
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
