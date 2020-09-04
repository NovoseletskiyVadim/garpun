'use strict';
const Sequelize = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: __dirname + process.env.SQL_DB,
  logging: false, // Disables logging
});

sequelize
  .authenticate()
  .then(() => {
    console.log('db connection OK.');
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

require('./models/camEvent')(sequelize);
require('./models/pendingList')(sequelize);

module.exports = sequelize;
