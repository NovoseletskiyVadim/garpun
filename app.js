'use strict';
const chokidar = require('chokidar');
const FileType = require('file-type');
const { fork } = require('child_process');
require('dotenv').config();
require('./db/dbConnect');
const eventHandler = require('./utils/eventHandler');
const rejectFileHandler = require('./utils/rejectFileHandler');
const forked = fork(`./utils/rejectApiHandler.js`);
const getFileMeta = require('./utils/getFileMeta');

forked.on('message', (msg) => {
  console.log(msg);
});

const evenWatcher = chokidar.watch(process.env.MEDIA_PATH, {
  ignored: /^\./,
  persistent: true,
});

evenWatcher
  .on('add', async (pathFile) => {
    const fileType = await FileType.fromFile(pathFile);
    const fileMeta = getFileMeta(pathFile);
    if (fileType && fileType.ext === 'jpg' && typeof fileMeta === 'object') {
      eventHandler(fileMeta);
    } else {
      //logger.saveErrorEvent({ message: 'WRONG_FILE_TYPE' + ' ' + pathFile });
      rejectFileHandler(pathFile);
      console.error('WRONG_FILE_TYPE', pathFile);
    }
  })
  .on('error', function (error) {
    console.error('Error happened', error);
  });

module.exports = { evenWatcher };
