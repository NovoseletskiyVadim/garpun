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

module.exports = {
  start: () => {
    return sequelize.authenticate();
  },
  dbCreate: () => {
    return sequelize.sync({ force: true });
  },
  sequelize,
};
