const chokidar = require('chokidar');
const FileType = require('file-type');
const eventHandler = require('./eventHandler');
const rejectFileHandler = require('./rejectFileHandler');
const getFileMeta = require('./getFileMeta');
const { appErrorLog, rejectFileLog } = require('./logger');

module.exports = () => {
  let calcFile = 0;
  let eventWatcher;

  return {
    startWatch: () => {
      eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
        ignored: /^\./,
        persistent: true,
      });
      console.log('Under watch: ' + process.env.MEDIA_PATH);
      eventWatcher
        .on('add', (pathFile) => {
          calcFile++;
          process.env.NODE_ENV === 'DEV' &&
            console.log('get new file ' + calcFile);
          const fileMeta = getFileMeta(pathFile);
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
              process.env.NODE_ENV === 'DEV' &&
                console.error('WRONG_FILE', pathFile);
            }
          });
        })
        .on('error', function (error) {
          if (error.code === 'UNKNOWN') {
            rejectFileHandler(error.path);
          }
          appErrorLog({ message: { text: 'WATCHER_ERROR', error: error } });
        });
    },
    stopWatcher: () => {
      eventWatcher.close().then(() => console.log('watcher closed'));
    },
  };
};
