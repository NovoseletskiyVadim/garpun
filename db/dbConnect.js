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

module.exports = {
  start: () => {
    console.log('DB_NAME', process.env.SQL_DB);
    return sequelize.authenticate();
  },
  dbCreate: () => {
    const { cameras, camEvents, pendingList } = sequelize.models;
    let tablesList = [];
    if (process.env.NODE_ENV === 'DEV') {
      tablesList = [
        cameras.sync(),
        camEvents.sync({ force: true }),
        pendingList.sync({ force: true }),
      ];
    } else {
      tablesList = [cameras.sync(), camEvents.sync(), pendingList.sync()];
    }

    return Promise.all(tablesList);
  },
  stop: () => {
    return sequelize.close();
  },
  sequelize,
};
