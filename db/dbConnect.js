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

const Model = Sequelize.Model;

class CamEvent extends Model {}

CamEvent.init(
  {
    uuid: {
      type: Sequelize.STRING,
      defaultValue: Sequelize.UUIDV4,
    },
    time: {
      type: Sequelize.DATE,
    },
    license_plate_number: {
      type: Sequelize.STRING,
    },
    uploaded: {
      type: Sequelize.BOOLEAN,
      defaultValue: false,
    },
    camera: {
      type: Sequelize.STRING,
    },
  },
  {
    sequelize,
    modelName: 'camEvents',
  }
);
CamEvent.sync({ force: true }); //TEMP create a new db all the time

class PendingList extends Model {}

PendingList.init(
  {
    status: {
      type: Sequelize.STRING,
    },
    data: {
      type: Sequelize.JSON,
    },
  },
  {
    sequelize,
    modelName: 'pendingList',
  }
);

PendingList.sync({ force: true });

module.exports = { CamEvent, PendingList };
