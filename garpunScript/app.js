require('dotenv').config();

const dbConnect = require('./db/dbConnect');
const eventWatcher = require('./utils/ftpWatcher/fileWatcher')();
const Logger = require('./utils/logger/appLog');
const logTypes = require('./utils/logger/logTypes');
const { camerasWatcher, rejectApiHandler } = require('./utils/childProcesses');

const logger = Logger();
logger(logTypes.APP_INFO, 'APP_STARTED_MODE: ' + process.env.NODE_ENV);

if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
  logger(logTypes.APP_INFO, 'FILE_ARCHIVE: ' + process.env.ARCHIVE_DAYS);
} else {
  logger(logTypes.APP_INFO, 'FILE_ARCHIVE: OFF');
}

dbConnect
  .dbCreate()
  .then(() => {
    logger(logTypes.APP_INFO, 'tables created');
    return;
  })
  .then(() => {
    return dbConnect.start().then(() => {
      logger(logTypes.APP_INFO, 'db connection OK.');
      return;
    });
  })
  .then(() => {
    camerasWatcher.send({ type: 'START' });
    rejectApiHandler.send({ type: 'START' });
    rejectApiHandler.on('message', (msg) => {
      switch (msg.type) {
        case 'REQ_SENT':
          break;

        default:
          break;
      }
    });

    eventWatcher.startWatch();
  })
  .catch((err) => {
    logger('APP_ERROR', { errorType: 'APP_START_ERROR', errorData: err.stack });
  });

const stopAPP = () => {
  rejectApiHandler.kill();
  watch.stopWatcher();
};

module.exports = { stopAPP };
