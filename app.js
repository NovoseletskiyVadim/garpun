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
      if (type && type.ext === 'jpg' && typeof fileMeta === 'object') {
        eventHandler(fileMeta);
      } else {
        //logger.saveErrorEvent({ message: 'WRONG_FILE_TYPE' + ' ' + pathFile });
        rejectFileHandler(pathFile);
        console.error('WRONG_FILE_TYPE', pathFile);
      }
    });
  })
  .on('error', function (error) {
    console.error('Error happened', error);
  });

module.exports = { eventWatcher };
