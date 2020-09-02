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

      if (type && type.ext === 'jpg') {
        
        // console.log('It\'s OK!!!'+pathFile);
        // const nameFile=pathFile.split("\\").pop();
        // console.log('nameFile='+nameFile+' typeoF= '+typeof nameFile);

        const patternCheckNameFile=/(\d{17})_([a-zA-Z0-9А-Яа-я]{4,8})_(VEHICLE_DETECTION)/;


        const RegExpArray=pathFile.match(patternCheckNameFile);

        console.log(RegExpArray);
        




      } else {

        console.error('WRONG_FILE_TYPE', pathFile);
      }
    });
  })
  .on('error', function (error) {
    console.error('Error happened', error);
  });

module.exports = { eventWatcher };
