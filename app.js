'use strict';
const chokidar = require('chokidar');
const FileType = require('file-type');
const path = require('path');
require('dotenv').config();
require('./db/dbConnect');
const eventHandler = require('./utils/eventHandler');

const evenWatcher = chokidar.watch(process.env.MEDIA_PATH, {
  ignored: /^\./,
  persistent: true,
});

evenWatcher
  .on('add', async (pathFile) => {
    const fileData = await FileType.fromFile(pathFile);
    if (fileData && fileData.ext === 'jpg') {
      eventHandler(pathFile);
    } else {
      logger.saveErrorEvent({ message: 'WRONG_FILE_TYPE' + ' ' + pathFile });
      console.log('WRONG_FILE_TYPE', pathFile);
    }
  })
  // .on('change', function (path) {
  //   console.log('File', path, 'has been changed');
  // })
  // .on('unlink', function (path) {
  //   // logger.removeFileLog({ pathFile: path });
  //   console.log('File', path, 'has been removed');
  // })
  .on('error', function (error) {
    console.error('Error happened', error);
  });

module.exports = { evenWatcher };
