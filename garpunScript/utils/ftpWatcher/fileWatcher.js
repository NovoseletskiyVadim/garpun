const chokidar = require('chokidar');

const fileHandler = require('./fileHandler');
const appLogger = require('../logger/appLogger');
const logTypes = require('../logger/logTypes');

module.exports = () => {
  let eventWatcher;
  return {
    startWatch: () => {
      eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
        ignored: /^\./,
        persistent: true,
        awaitWriteFinish: true,
      });
      appLogger.printLog(
        logTypes.APP_INFO,
        'Under watch: ' + process.env.MEDIA_PATH
      );
      eventWatcher
        .on('add', (pathFile) => {
          return fileHandler(pathFile);
        })
        .on('error', function (error) {
          appLogger.printLog(logTypes.APP_ERROR, {
            errorType: 'FILE_WATCHER_ERROR',
            errorData: error,
          });
        });
    },

    stopWatcher: () => {
      eventWatcher.close().then(() => console.log('watcher closed'));
    },
  };
};
