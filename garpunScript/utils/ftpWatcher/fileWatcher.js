const fs = require('fs');

const chokidar = require('chokidar');
const FileType = require('file-type');

const { camerasWatcher } = require('../childProcesses');
const eventHandler = require('./fileHandler');
const { rejectFileHandler } = require('../fileExplorer/fileExplorer');
const getFileMeta = require('../fileExplorer/getFileMeta');
const { rejectFileLog } = require('../logger/logToFile');
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
          const fileSize = fs.statSync(pathFile).size;
          const fileMeta = getFileMeta(pathFile);
          camerasWatcher.send({ type: 'EVENT', data: fileMeta.cameraName });
          FileType.fromFile(pathFile).then((type) => {
            if (!type || type.ext !== 'jpg') {
              fileMeta.isValid = false;
              fileMeta.notPassed.push('FILE_TYPE');
            }
            if (fileSize > parseInt(process.env.MAX_FILE_SIZE, 10)) {
              fileMeta.isValid = false;
              fileMeta.notPassed.push('FILE_SIZE');
            }
            if (fileMeta.isValid) {
              eventHandler(fileMeta);
            } else {
              rejectFileLog({
                message: fileMeta.notPassed.join(),
                file: fileMeta.file,
              });
              appLogger.printLog(
                logTypes.WRONG_FILE,
                `WRONG ${fileMeta.notPassed.join(' ')} camera:${
                  fileMeta.cameraName
                } photo:${fileMeta.file.name}${fileMeta.file.ext}`
              );
              rejectFileHandler(fileMeta);
            }
          });
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
