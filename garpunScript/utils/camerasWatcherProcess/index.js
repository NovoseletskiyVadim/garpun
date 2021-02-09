const watcher = require('./watcher')();
const appLogger = require('../logger/appLogger');
const logTypes = require('./../logger/logTypes');

process.on('message', (event) => {
  const { type, data } = event;
  switch (type) {
    case 'START':
      appLogger.printLog(
        logTypes.APP_INFO,
        `CamerasWatcher started ID:${process.pid}`
      );
      watcher.startWatch();
      break;
    case 'EVENT':
      watcher.cameraAction(data);
    default:
      break;
  }
});
