const { DataTypes } = require('sequelize');
const { mainDbConnection } = require('../db/dbConnect');

module.exports = mainDbConnection.define('camEvents', {
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
    apiResponse: {
        type: DataTypes.JSON,
    },
    fileName: {
        type: DataTypes.STRING,
    },
    fileErrors: {
        type: DataTypes.STRING,
    },
});
