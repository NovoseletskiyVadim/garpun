const watcher = require('./watcher')();
const { printLog, logTypes } = require('../logger/appLogger');

process.on('message', (event) => {
  const { type, data } = event;
  switch (type) {
    case 'START':
      printLog(logTypes.APP_INFO, `CamerasWatcher started ID:${process.pid}`);
      watcher.startWatch();
      break;
    case 'EVENT':
      watcher.cameraAction(data);
    default:
      break;
  }
});
