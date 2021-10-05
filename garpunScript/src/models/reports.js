const { DataTypes } = require('sequelize');
const { mainDbConnection } = require('../db/dbConnect');

module.exports = mainDbConnection.define('statReports', {
    reportData: {
        type: DataTypes.STRING,
    },
});
