'use strict';
const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: __dirname + process.env.SQL_DB,
  logging: false, // Disables logging
});

require('../models/camEvent')(sequelize);
require('../models/pendingList')(sequelize);
// sequelize.sync({ force: true });
// sequelize
//   .authenticate()
//   .then(() => {
//     console.log('db connection OK.');
//   })
//   .catch((err) => {
//     console.error('Unable to connect to the database:', err);
//   });//   .catch((err) => {
//     console.error('Unable to connect to the database:', err);
//   });

module.exports = {
  start: () => {
    return sequelize.authenticate();
  },
  dbCreate: () => {
    return sequelize.sync({ force: true });
  },
  sequelize,
};
