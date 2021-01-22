const RejectWatcher = require('./watcher');
const jsonResend = require('./resender');
const appLogger = require('./../logger/appLogger');
const logTypes = require('./../logger/logTypes');

const watcher = new RejectWatcher(jsonResend);

process.on('message', (event) => {
  const { type, data } = event;
  switch (type) {
    case 'START':
      appLogger.printLog(
        logTypes.APP_INFO,
        `JsonResender started ID:${process.pid}`
      );
      watcher.startWatch();
      break;
    case 'STOP':
      watcher.stopWatch();
    default:
      break;
  }
});
