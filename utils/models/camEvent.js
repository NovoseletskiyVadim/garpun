const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  sequelize.define('camEvents', {
    uuid: {
      type: DataTypes.STRING,
      defaultValue: DataTypes.UUIDV4,
    },
    time: {
      type: DataTypes.DATE,
    },
    license_plate_number: {
      type: DataTypes.STRING,
    },
    uploaded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    camera: {
      type: DataTypes.STRING,
    },
  });
};
