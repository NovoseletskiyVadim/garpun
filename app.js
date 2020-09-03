'use strict';

const chokidar = require('chokidar');
const FileType = require('file-type');
require('dotenv').config();
require('./db/dbConnect');
const { fork } = require('child_process');
const eventHandler = require('./utils/eventHandler');
const rejectFileHandler = require('./utils/rejectFileHandler');
const forked = fork(`./utils/rejectApiHandler.js`);
const getFileMeta = require('./utils/getFileMeta');
const appLogger = require('./utils/logger');

forked.on('message', (msg) => {
  console.log(msg);
});

const eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
  ignored: /^\./,
  persistent: true,
});

eventWatcher
  .on('add', (pathFile) => {
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

module.exports = { eventWatcher };
