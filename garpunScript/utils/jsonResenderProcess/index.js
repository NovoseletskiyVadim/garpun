const RejectWatcher = require('./watcher');
const jsonResend = require('./resender');
const Logger = require('../logger/appLog');

const watcher = new RejectWatcher(jsonResend);

process.on('message', (event) => {
  const logger = Logger();
  const { type, data } = event;
  switch (type) {
    case 'START':
      logger('APP_START_INFO', `JsonResender started ID:${process.pid}`);
      watcher.startWatch();
      break;
    case 'STOP':
      watcher.stopWatch();
    default:
      break;
  }
});
