'use strict';
const chokidar = require('chokidar');
const FileType = require('file-type');
const { fork } = require('child_process');
require('dotenv').config();
require('./db/dbConnect');
const eventHandler = require('./utils/eventHandler');

const forked = fork(`./utils/rejectApiHandler.js`);

forked.on('message', (msg) => {
  console.log(msg);
});

forked.send({ hello: 'world' });

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
  .on('error', function (error) {
    console.error('Error happened', error);
  });

module.exports = { evenWatcher };
