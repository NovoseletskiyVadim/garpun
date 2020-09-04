'use strict';

const fs = require('fs');
require('dotenv').config();
const dbConnect = require('./db/dbConnect');
const { fork } = require('child_process');
const eventWatcher = require('./utils/eventWatcher');

console.log(process.env.MEDIA_PATH);

if (!fs.existsSync(process.env.MEDIA_PATH)) {
  fs.mkdirSync(process.env.MEDIA_PATH);
  console.log('watch dir created');
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
    // const forked = fork(`./utils/rejectApiHandler.js`);
    // forked.on('message', (msg) => {
    //   console.log(msg);
    // });
    eventWatcher.startWatch();
  })
  .catch((err) => {
    console.error('Unable to connect to the database:', err);
  });

module.exports = { eventWatcher };
