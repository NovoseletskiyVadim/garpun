const chokidar = require('chokidar');
const FileType = require('file-type');
const eventHandler = require('./eventHandler');
const rejectFileHandler = require('./rejectFileHandler');
const getFileMeta = require('./getFileMeta');
const appLogger = require('./logger');
const eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
  ignored: /^\./,
  persistent: true,
});

module.exports = {
  startWatch: () => {
    console.log('sdfs');
    return eventWatcher
      .on('add', (pathFile) => {
        console.log(pathFile);
        const fileMeta = getFileMeta(pathFile);
        FileType.fromFile(pathFile).then((type) => {
          if (!type || type.ext !== 'jpg') {
            fileMeta.isValid = false;
            fileMeta.notPassed.push('FILE_TYPE');
          }
          if (fileMeta.isValid) {
            eventHandler(fileMeta);
          } else {
            appLogger.rejectFileLog({
              message: fileMeta.notPassed.join(),
              file: fileMeta.file,
            });
            rejectFileHandler(pathFile);
            console.error('WRONG_FILE', pathFile);
          }
        });
      })
      .on('error', function (error) {
        console.log(error.code);
        if (error.code === 'UNKNOWN') {
          rejectFileHandler(error.path);
        }

        console.error('Error happened', error);
      });
  },
};
