require('dotenv').config();

const dbConnect = require('./db/dbConnect');
const ftpWatcher = require('./utils/ftpWatcher/fileWatcher')();
const appLogger = require('./utils/logger/appLogger');
const logTypes = require('./utils/logger/logTypes');
const { camerasWatcher, rejectApiHandler } = require('./utils/childProcesses');

appLogger.printLog(
  logTypes.APP_INFO,
  'APP_STARTED_MODE: ' + process.env.NODE_ENV
);
appLogger.printLog(logTypes.APP_INFO, 'APP_ID: ' + process.pid);

if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
  appLogger.printLog(
    logTypes.APP_INFO,
    'FILE_ARCHIVE: ' + process.env.ARCHIVE_DAYS
  );
} else {
  appLogger.printLog(logTypes.APP_INFO, 'FILE_ARCHIVE: OFF');
}

const app = dbConnect
  .dbTablesCreate()
  .then(() => {
    appLogger.printLog(logTypes.APP_INFO, 'tables created');
    return true;
  })
  .then(() => {
    camerasWatcher.send({ type: 'START' });
    rejectApiHandler.send({ type: 'START' });
    ftpWatcher.startWatch();
  })
  .catch((err) => {
    appLogger.printLog('APP_ERROR', {
      errorType: 'APP_START_ERROR',
      errorData: err.stack,
    });
  });

const stopAPP = () => {
  rejectApiHandler.kill();
  camerasWatcher.kill();
  ftpWatcher.stopWatcher();
};

module.exports = { stopAPP, app };
