'use strict';
console.log(process);
const fs = require('fs');
require('dotenv').config();
const dbConnect = require('./db/dbConnect');
const { fork } = require('child_process');
const eventWatcher = require('./utils/eventWatcher');
const appErrorLog = require('./utils/logger');
console.log(`APPs PID ${process.pid}`);
if (!fs.existsSync(process.env.MEDIA_PATH)) {
  try {
    fs.mkdirSync(process.env.MEDIA_PATH);
  } catch (error) {
    appErrorLog({ message: { text: error.message, error } });
  }
}

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
    const forked = fork(`./utils/rejectApiHandler.js`);
    forked.on('message', (msg) => {
      console.log(msg);
    });
    eventWatcher.startWatch();
  })
  .catch((err) => {
    appErrorLog({ message: { text: 'db error', error: err } });
  });

module.exports = { eventWatcher };
