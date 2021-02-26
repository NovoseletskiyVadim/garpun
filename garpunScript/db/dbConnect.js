const path = require('path');
const Sequelize = require('sequelize');

const { printLog, logTypes } = require('../utils/logger/appLogger');

const mainDbConnection = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.MAIN_DB || path.join(__dirname, 'main.db'),
  logging: false, // Disables logging
});

const cashReqDbConnection = new Sequelize({
  dialect: 'sqlite',
  storage: process.env.TEMP_DB_PATH || path.join(__dirname, 'temp.db'),
  logging: false, // Disables logging
});

module.exports = {
  connectionTest: () => {
    const main = mainDbConnection.authenticate();
    const cash = cashReqDbConnection.authenticate();
    return Promise.all([main, cash]).then(() => {
      printLog(logTypes.APP_INFO, 'Connections with data bases OK');
      return true;
    });
  },
  dbTablesCreate: () => {
    const CamEvents = require('../models/camEvent');
    const PendingList = require('../models/pendingList');
    const Cameras = require('../models/cameras');
    const Users = require('../models/users');

    let tablesList = [];
    //if NODE_ENV === 'DEV' clean test DB table PendingList and CamEvents
    if (process.env.NODE_ENV === 'DEV') {
      tablesList = [
        Cameras.sync({ alter: true }),
        CamEvents.sync({ force: true }),
        PendingList.sync({ force: true }),
        Users.sync({ alter: true }),
      ];
    } else {
      tablesList = [
        Cameras.sync({ alter: true }),
        CamEvents.sync({ alter: true }),
        PendingList.sync({ alter: true }),
        Users.sync({ alter: true }),
      ];
    }
    return Promise.all(tablesList);
  },
  stop: () => {
    return sequelize.close();
  },
  mainDbConnection,
  cashReqDbConnection,
};
