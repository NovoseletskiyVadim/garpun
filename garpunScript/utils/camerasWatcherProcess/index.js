const watcher = require('./watcher')();
const Logger = require('../logger/appLog');

const logger = Logger();

process.on('message', (event) => {
  const { type, data } = event;
  switch (type) {
    case 'START':
      logger('APP_START_INFO', `CamerasWatcher started ID:${process.pid}`);
      watcher.startWatch();
      break;
    case 'EVENT':
      watcher.cameraAction(data);
    default:
      break;
  }
});
