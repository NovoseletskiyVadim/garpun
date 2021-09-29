const { DataTypes } = require('sequelize');
const { cashReqDbConnection } = require('../db/dbConnect');

module.exports = cashReqDbConnection.define('pendingList', {
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
