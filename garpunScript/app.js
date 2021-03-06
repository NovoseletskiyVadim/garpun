require('dotenv').config();

const dbConnect = require('./db/dbConnect');
const { printLog, logTypes } = require('./utils/logger/appLogger');
const { appStartAlert } = require('./utils/telegBot/harpoonBot');
const harpoonStarter = require('./utils/starter/starter');
const { camerasWatcher, rejectApiHandler } = require('./utils/childProcesses');

printLog(logTypes.APP_INFO, 'APP_STARTED_MODE: ' + process.env.NODE_ENV);
printLog(logTypes.APP_INFO, 'APP_ID: ' + process.pid);

if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
  printLog(logTypes.APP_INFO, 'FILE_ARCHIVE: ' + process.env.ARCHIVE_DAYS);
} else {
  printLog(logTypes.APP_INFO, 'FILE_ARCHIVE: OFF');
}

const app = dbConnect
  .connectionTest()
  // uncomment this for first start
  // .then(() => {
  //   return dbConnect.dbTablesCreate().then(() => {
  //     printLog(logTypes.APP_INFO, 'tables created');
  //     return true;
  //   });
  // })
  .then(() => {
    camerasWatcher.send({ type: 'START' });
    rejectApiHandler.send({ type: 'START' });
    appStartAlert();
    return harpoonStarter();
  })
  .catch((err) => {
    printLog(logTypes.APP_ERROR, {
      errorType: 'APP_START_ERROR',
      errorData: err.stack,
    });
  });

const stopAPP = () => {
  rejectApiHandler.kill();
  camerasWatcher.kill();
};

module.exports = { stopAPP, app };
