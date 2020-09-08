const chokidar = require('chokidar');
const FileType = require('file-type');
const eventHandler = require('./eventHandler');
const rejectFileHandler = require('./rejectFileHandler');
const getFileMeta = require('./getFileMeta');
const { appErrorLog, rejectFileLog } = require('./logger');

let calcFile = 0;
module.exports = {
  startWatch: () => {
    const eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
      ignored: /^\./,
      persistent: true,
    });
    console.log('Under watch: ' + process.env.MEDIA_PATH);
    eventWatcher
      .on('add', (pathFile) => {
        calcFile++;
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
};
