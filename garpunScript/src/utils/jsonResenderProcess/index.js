const RejectWatcher = require('./watcher');
const jsonResend = require('./resender');
const { printLog, logTypes } = require('../logger/appLogger');

const watcher = new RejectWatcher(jsonResend);

process.on('message', (event) => {
  const { type } = event;
  switch (type) {
    case 'START':
      printLog(logTypes.APP_INFO, `JsonResender started ID:${process.pid}`);
      watcher.startWatch();
      break;
    case 'STOP':
      watcher.stopWatch();
      break;
    default:
      break;
  }
});
