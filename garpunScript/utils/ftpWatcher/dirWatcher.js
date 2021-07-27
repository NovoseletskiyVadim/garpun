const chokidar = require('chokidar');

const fileHandler = require('./fileHandler');
const { printLog, logTypes } = require('../logger/appLogger');

module.exports = () => {
  const ignoredFiles = ['.*DVRWorkDirectory.*'];
  let dirWatchersList = new Map();
  return {
    addDirToWatch: (options) => {
      const { dirName, watchPath } = options;
      const watcher = chokidar.watch(watchPath, {
        ignored: new RegExp(ignoredFiles.join('|'), 'gi'),
        persistent: true,
        awaitWriteFinish: true,
      });
      dirWatchersList.set(dirName, watcher);
      printLog(logTypes.APP_INFO, 'Under watch: ' + watchPath);
      watcher
        .on('add', (pathFile) => {
          return fileHandler(pathFile);
        })
        .on('error', function (error) {
          printLog(logTypes.APP_ERROR, {
            errorType: 'FILE_WATCHER_ERROR',
            errorData: error,
          });
        });
    },
    stopWatchDir: (dirName) => {
      const watcher = dirWatchersList.get(dirName);
      watcher.close().then(() => {
        dirWatchersList.delete(dirName);
        console.log('Stop watch ' + dirName);
      });
    },
  };
};
