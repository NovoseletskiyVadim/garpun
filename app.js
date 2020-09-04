'use strict';

const chokidar = require('chokidar');
require('dotenv').config();
const watcherEventAdd = require('./utils/watcher/watcherEventAdd');
const watcherEventAddNewFile = require('./utils/watcher/watcherEventAddNewFile.js');



const eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
  ignored: /^\./,
  persistent: true,
});

eventWatcher
  .on('add', (pathFile) => {
    
    // variant 1
    // watcherEventAdd.eventWatchAddNewFile(pathFile);

    // variant 2
    watcherEventAddNewFile.watcherEventAddNewFile(pathFile);
  })
  .on('error', function (error) {
    
    // TODO: придумать как обрабатывать это событие
    console.error('Error happened', error);
  });

module.exports = { eventWatcher };
