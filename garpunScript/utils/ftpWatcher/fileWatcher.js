const fs = require('fs');

const chokidar = require('chokidar');
const FileType = require('file-type');

const { camerasWatcher } = require('../childProcesses');
const rightFileHandler = require('./fileHandler');
const { rejectFileHandler } = require('../fileExplorer/fileExplorer');
const getFileMeta = require('../fileExplorer/getFileMeta');
const appLogger = require('../logger/appLogger');
const logTypes = require('../logger/logTypes');
const CamEvents = require('../../models/camEvent');

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
          let fileMeta = getFileMeta(pathFile);
          camerasWatcher.send({ type: 'EVENT', data: fileMeta.cameraName });
          return FileType.fromFile(pathFile).then((type) => {
            if (!type || type.ext !== 'jpg') {
              fileMeta.isValid = false;
              fileMeta.notPassed.push('FILE_TYPE');
            }
            if (fileSize > parseInt(process.env.MAX_FILE_SIZE, 10)) {
              fileMeta.isValid = false;
              fileMeta.notPassed.push('FILE_SIZE');
            }
            const dataToLocalDB = {
              uuid: fileMeta.uuid,
              time: fileMeta.isValid ? fileMeta.eventDate : null,
              license_plate_number: fileMeta.isValid
                ? fileMeta.plateNumber
                : null,
              camera: fileMeta.cameraName,
              fileName: fileMeta.file.name + fileMeta.file.ext,
              fileErrors: fileMeta.notPassed.join(),
            };
            return CamEvents.create(dataToLocalDB).then((event) => {
              if (fileMeta.isValid) {
                return rightFileHandler(fileMeta, event);
              } else {
                appLogger.printLog(
                  logTypes.WRONG_FILE,
                  `WRONG ${fileMeta.notPassed.join(' ')} camera:${
                    fileMeta.cameraName
                  } photo:${fileMeta.file.name}${fileMeta.file.ext}`
                );
                return rejectFileHandler(fileMeta);
              }
            });
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
