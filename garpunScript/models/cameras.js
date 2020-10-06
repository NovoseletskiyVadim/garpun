const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('cameras', {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
    },
    ftpHomeDir: {
      type: DataTypes.STRING,
    },
    ftpPassword: {
      type: DataTypes.STRING,
    },
    ftpUsername: {
      type: DataTypes.STRING,
    },
    name: {
      type: DataTypes.STRING,
    },
    position: {
      type: DataTypes.STRING,
    },
    cameraIP: {
      type: DataTypes.STRING,
    },
    isOnLine: {
      type: DataTypes.BOOLEAN,
    },
  });
};
