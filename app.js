'use strict';

const chokidar = require('chokidar');
const FileType = require('file-type');
require('dotenv').config();

const eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
  ignored: /^\./,
  persistent: true,
});

eventWatcher
  .on('add', (pathFile) => {

    FileType.fromFile(pathFile).then((type) => {

      if (type && type.ext === 'jpg') {

        console.log('It\'s OK!!!'+pathFile);

      } else {

        console.error('WRONG_FILE_TYPE', pathFile);
      }
    });
  })
  .on('error', function (error) {
    console.error('Error happened', error);
  });

module.exports = { eventWatcher };
