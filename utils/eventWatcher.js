const chokidar = require('chokidar');
const FileType = require('file-type');
const eventHandler = require('./eventHandler');
const rejectFileHandler = require('./rejectFileHandler');
const getFileMeta = require('./getFileMeta');
const appLogger = require('./logger');

module.exports = {
  startWatch: () => {
    const eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
      ignored: /^\./,
      persistent: true,
    });
    console.log('Under watch: ' + process.env.MEDIA_PATH);
    eventWatcher
      .on('add', (pathFile) => {
        console.log('new file');
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
