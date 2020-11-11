const { DataTypes } = require('sequelize');
const dbConnect = require('./../db');
const bcrypt = require('bcrypt');

const User = dbConnect.define('userList', {
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
  chatMsgOm: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

User.prototype.comparePassword = function (password) {
  return bcrypt.compare(password, this.userPassword);
};

User.addHook('beforeSave', (user) => {
  user.userLogin = user.userLogin.trim();
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(user.userPassword, salt);
  user.userPassword = hash;
  return user;
});

module.exports = User;
