'use strict';

const chokidar = require('chokidar');
require('dotenv').config();
const watcherEventAdd =require('./events/watcherEventAdd');



const eventWatcher = chokidar.watch(process.env.MEDIA_PATH, {
  ignored: /^\./,
  persistent: true,
});

eventWatcher
  .on('add', (pathFile) => {
    // variant 1
    // watcherEventAdd.eventWatchAddNewFile(pathFile);

    // variant 2
    
    
  })
  .on('error', function (error) {
    console.error('Error happened', error);
  });

module.exports = { eventWatcher };
