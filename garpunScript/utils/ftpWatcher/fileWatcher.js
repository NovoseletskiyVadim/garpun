const fs = require('fs');

const chokidar = require('chokidar');
const FileType = require('file-type');

const { camerasWatcher } = require('../childProcesses');
const eventHandler = require('./fileHandler');
const { rejectFileHandler } = require('../fileExplorer/fileExplorer');
const getFileMeta = require('../fileExplorer/getFileMeta');
const { rejectFileLog } = require('../logger/appLoggerToFile');
const Logger = require('../logger/appLog');

module.exports = () => {
  let eventWatcher;
  const logger = Logger();
  return {
    startWatch: () => {
      eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
        ignored: /^\./,
        persistent: true,
        awaitWriteFinish: true,
      });
      logger('APP_START_INFO', 'Under watch: ' + process.env.MEDIA_PATH);
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
              logger(
                'WRONG_FILE',
                `WRONG ${fileMeta.notPassed.join(' ')} camera:${
                  fileMeta.cameraName
                } photo:${fileMeta.file.name}${fileMeta.file.ext}`
              );
              rejectFileHandler(fileMeta);
            }
          });
        })
        .on('error', function (error) {
          logger('APP_ERROR', {
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
