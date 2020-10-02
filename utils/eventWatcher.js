const chokidar = require('chokidar');
const FileType = require('file-type');
const eventHandler = require('./eventHandler');
const rejectFileHandler = require('./rejectFileHandler');
const getFileMeta = require('./getFileMeta');
const { appErrorLog, rejectFileLog } = require('./logger');
const fs = require('fs');

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
          if (fileSize < 250000) {
            FileType.fromFile(pathFile).then((type) => {
              if (!type || type.ext !== 'jpg') {
                fileMeta.isValid = false;
                fileMeta.notPassed.push('FILE_TYPE');
              }
              if (fileMeta.isValid) {
                eventHandler(fileMeta);
              } else {
                rejectFileLog({
                  message: fileMeta.notPassed.join(),
                  file: fileMeta.file,
                });
                rejectFileHandler(fileMeta);
                console.error(
                  `WRONG_FILE WHY: ${fileMeta.notPassed.join(' ')} camera:${
                    fileMeta.cameraName
                  } photo:${fileMeta.file.name}${fileMeta.file.ext}`
                );
              }
            });
          } else {
            rejectFileHandler(fileMeta);
            console.error(
              `WRONG_FILE WHY: FILE_SIZE>200Kb ${fileMeta.notPassed.join(
                ' '
              )} camera:${fileMeta.cameraName} photo:${fileMeta.file.name}${
                fileMeta.file.ext
              }`
            );
          }
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
