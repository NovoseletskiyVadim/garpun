'use strict';

const FileType = require('file-type');
require('./db/dbConnect');
const eventHandler = require('./utils/eventHandler');
const rejectFileHandler = require('./utils/rejectFileHandler');
const getFileMeta = require('./utils/getFileMeta');
const appLogger = require('./utils/logger');


const watcherAddNewFile = function(pathFile){
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
};




module.exports = { watcherAddNewFile };
