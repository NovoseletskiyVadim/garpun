const { DataTypes } = require('sequelize');

require('dotenv').config({ path: '../.env' });
console.log(process.env);

const dbConnect = require('../db/dbConnect');

dbConnect.connectionTest().then(() => {
  const queryInterface = dbConnect.sequelize.getQueryInterface();
  queryInterface.addColumn(
    'camEvents', // table name
    'fileErrors', // new field name
    {
      type: DataTypes.STRING,
    }
  );
});
