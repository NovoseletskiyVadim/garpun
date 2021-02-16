const path = require('path');
const Sequelize = require('sequelize');

const appLogger = require('../utils/logger/appLogger');
const logTypes = require('../utils/logger/logTypes');

const mainDbConnection = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, process.env.SQL_DB),
  logging: false, // Disables logging
});

const cashReqDbConnection = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, 'cashDb.db'),
  logging: false, // Disables logging
});

module.exports = {
  connectionTest: () => {
    const main = mainDbConnection.authenticate();
    const cash = cashReqDbConnection.authenticate();
    return Promise.all([main, cash]).then(() => {
      appLogger.printLog(
        logTypes.APP_INFO,
        'Connection with ' + process.env.SQL_DB + ' cashDb.db OK'
      );
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
