const chokidar = require('chokidar');
const moment = require('moment');
const FileType = require('file-type');
const fs = require('fs');
const { camerasWatcher } = require('./childProcesses');
const eventHandler = require('./eventHandler');
const { rejectFileHandler } = require('./fileExplorer');
const getFileMeta = require('./getFileMeta');
const { appErrorLog, rejectFileLog } = require('./logger');
const socketMsgSender = require('../socketIO');

module.exports = () => {
  let eventWatcher;

  return {
    startWatch: () => {
      eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
        ignored: /^\./,
        persistent: true,
        awaitWriteFinish: true,
      });
      console.log('Under watch: ' + process.env.MEDIA_PATH);
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
              rejectFileHandler(fileMeta).then(() => {
                socketMsgSender.newEvent({
                  eventTime: moment(fileMeta.eventDate).format(
                    'YYYY-MM-DD HH:mm:ss'
                  ),
                  cameraName: fileMeta.cameraName,
                  plateNumber: fileMeta.plateNumber || ' ',
                  isErrors: fileMeta.notPassed,
                  filePath: fileMeta.notPassed.includes('FILE_TYPE')
                    ? false
                    : `/images/trash_files/${
                        fileMeta.cameraName
                      }/${moment().format('YYYYMMDD')}/${
                        fileMeta.file.name + fileMeta.file.ext
                      }`,
                });
              });
              console.log(
                '\x1b[31m%s\x1b[0m',
                `WRONG ${fileMeta.notPassed.join(' ')} camera:${
                  fileMeta.cameraName
                } photo:${fileMeta.file.name}${fileMeta.file.ext}`
              );
            }
          });
        })
        .on('error', function (error) {
          console.error('WATCHER_ERROR', error);
          appErrorLog({ message: { text: 'WATCHER_ERROR', error } });
        });
    },
    stopWatcher: () => {
      eventWatcher.close().then(() => console.log('watcher closed'));
    },
  };
};
