const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('pendingList', {
    status: {
      type: DataTypes.STRING,
    },
    data: {
      type: DataTypes.JSON,
    },
    dbID: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
    },
    fileMeta: {
      type: DataTypes.JSON,
    },
  });
};
