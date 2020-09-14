'use strict';
const fs = require('fs');
require('dotenv').config();
const dbConnect = require('./db/dbConnect');
const { fork } = require('child_process');
const eventWatcher = require('./utils/eventWatcher');
const { appErrorLog } = require('./utils/logger');
console.log(`APPs PID ${process.pid}`);
if (!fs.existsSync(process.env.MEDIA_PATH)) {
  try {
    fs.mkdirSync(process.env.MEDIA_PATH);
  } catch (error) {
    console.log('CREATE_MEDIA_DIR_ERROR');
    appErrorLog({ message: { text: 'CREATE_MEDIA_DIR_ERROR', error } });
  }
}

const watch = eventWatcher();
let forked;

dbConnect
  .dbCreate()
  .then(() => {
    console.log('tables created');
    return;
  })
  .then(() => {
    return dbConnect.start().then(() => {
      console.log('db connection OK.');
      return;
    });
  })
  .then(() => {
    forked = fork(`./utils/rejectApiHandler.js`);
    forked.on('message', (msg) => {
      console.log(msg);
    });
    watch.startWatch();
  })
  .catch((err) => {
    console.log('APP_START_ERROR');
    console.log(err.stack);
    appErrorLog({
      message: { text: 'APP_START_ERROR', error: err.stack },
    });
  });

const stopAPP = () => {
  forked.kill();
  watch.stopWatcher();
};

module.exports = { stopAPP };
