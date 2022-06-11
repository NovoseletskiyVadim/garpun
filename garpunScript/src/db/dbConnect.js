/* eslint-disable global-require */
const path = require('path');

const Sequelize = require('sequelize');

const config = require('../common/config');
const { printLog } = require('../utils/logger/appLogger');

// const mainDbPath =
//     config.MAIN_DB_PATH || path.join(__dirname, './../../dataBase/main.db');
const cashDbPath =
    config.TEMP_DB_PATH || path.join(__dirname, './../../dataBase/temp.db');

// const mainDbConnection = new Sequelize({
//     dialect: 'sqlite',
//     storage: mainDbPath,
//     logging: false, // Disables logging
// });

const cashReqDbConnection = new Sequelize({
    dialect: 'sqlite',
    storage: cashDbPath,
    logging: false, // Disables logging
});

module.exports = {
    connectionTest: () => {
        // const main = mainDbConnection.authenticate();
        const cash = cashReqDbConnection.authenticate();
        return Promise.all([cash]).then(() => {
            printLog(
                `cashDbPath:${cashDbPath}`
            ).appInfoMessage();
            printLog('Connections with data bases OK').appInfoMessage();
            return true;
        });
    },
    dbTablesCreate: () => {
        const CamEvents = require('../models/camEvent');
        const PendingList = require('../models/pendingList');
        const Cameras = require('../models/cameras');
        const Users = require('../models/users');
        const Reports = require('../models/reports');

        let tablesList = [];

        // if NODE_ENV === 'DEV' clean test DB table PendingList and CamEvents

        if (process.env.NODE_ENV === 'DEV') {
            tablesList = [
                Cameras.sync({ alter: true }),
                CamEvents.sync({ force: true }),
                PendingList.sync({ force: true }),
                Users.sync({ alter: true }),
                Reports.sync({ alter: true }),
            ];
        } else {
            tablesList = [
                Cameras.sync({ alter: true }),
                CamEvents.sync({ alter: true }),
                PendingList.sync({ alter: true }),
                Users.sync({ alter: true }),
                Reports.sync({ alter: true }),
            ];
        }
        return Promise.all(tablesList);
    },
    stop: () => {
        // mainDbConnection.close();
        cashReqDbConnection.close();
    },
    // mainDbConnection,
    cashReqDbConnection,
};
