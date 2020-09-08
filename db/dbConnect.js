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
    return sequelize.authenticate();
  },
  dbCreate: () => {
    const { cameras, camEvents, pendingList } = sequelize.models;
    const tableCreate = [
      cameras.sync(),
      camEvents.sync({ force: true }),
      pendingList.sync({ force: true }),
    ];
    return Promise.all(tableCreate);
  },
  stop: () => {
    return sequelize.close();
  },
  sequelize,
};
