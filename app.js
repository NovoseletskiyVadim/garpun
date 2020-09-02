'use strict';

const chokidar = require('chokidar');
const FileType = require('file-type');
require('dotenv').config();

const LogRegExp = require('./utils/logerRegExp')

const eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
  ignored: /^\./,
  persistent: true,
});

eventWatcher
  .on('add', (pathFile) => {

    FileType.fromFile(pathFile).then((type) => {

      const patternCheckNameFile=/(\d{17})_([a-zA-Z0-9А-Яа-я]{4,8})_(VEHICLE_DETECTION)/;
      const RegExpArray=pathFile.match(patternCheckNameFile);

      if (type && type.ext === 'jpg') {
        
        LogRegExp.saveDetectEvent(RegExpArray);

      } else {

        const err='WRONG_FILE_TYPE'     

        LogRegExp.saveErrorEvent(RegExpArray,err);
      
      }
    });
  })
  .on('error', function (error) {
    console.error('Error happened', error);
  });

module.exports = { eventWatcher };
