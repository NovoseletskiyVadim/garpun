'use strict';
const path = require('path');
const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, process.env.SQL_DB),
  logging: false, // Disables logging
});

require('../models/camEvent')(sequelize);
require('../models/pendingList')(sequelize);
require('../models/cameras')(sequelize);
require('../models/users')(sequelize);

module.exports = {
  start: () => {
    return sequelize.authenticate();
  },
  dbCreate: () => {
    console.log('DB_NAME', process.env.SQL_DB);
    const { cameras, camEvents, pendingList, userList } = sequelize.models;
    let tablesList = [];
    //if NODE_ENV === 'DEV' clean test DB
    if (process.env.NODE_ENV === 'DEV') {
      tablesList = [
        cameras.sync({ alter: true }),
        camEvents.sync({ force: true }),
        pendingList.sync({ force: true }),
        userList.sync({ alter: true }),
      ];
    } else {
      tablesList = [
        cameras.sync({ alter: true }),
        camEvents.sync({ alter: true }),
        pendingList.sync({ alter: true }),
        userList.sync({ alter: true }),
      ];
    }

    return Promise.all(tablesList);
  },
  stop: () => {
    return sequelize.close();
  },
  sequelize,
};
