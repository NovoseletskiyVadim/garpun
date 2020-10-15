const watcher = require('./watcher')();

process.on('message', (event) => {
  const { type, data } = event;
  switch (type) {
    case 'START':
      console.log(`camerasWatcher started ID:${process.pid}`);
      watcher.startWatch();
      break;
    case 'EVENT':
      watcher.cameraAction(data);
    default:
      break;
  }
});
