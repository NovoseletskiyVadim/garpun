const path = require('path');
const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, process.env.SQL_DB),
  logging: false, // Disables logging
});

module.exports = {
  start: () => {
    return sequelize.authenticate();
  },
  dbCreate: () => {
    console.log('DB_NAME', process.env.SQL_DB);

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
  sequelize,
};
