'use strict';
require('dotenv').config();
require('./utils/harpoonBot');
const dbConnect = require('./db/dbConnect');
const eventWatcher = require('./utils/eventWatcher')();
const { appErrorLog } = require('./utils/logger');
const { socketStart, apiResp } = require('./socketIO');
const { camerasWatcher, rejectApiHandler } = require('./utils/childProcesses');

console.log('APP_STARTED_MODE: ' + process.env.NODE_ENV);

let forked;

socketStart();

if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
  console.log('FILE_ARCHIVE: ' + process.env.ARCHIVE_DAYS);
} else {
  console.log('FILE_ARCHIVE: OFF');
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
    camerasWatcher.send({ type: 'START' });
    rejectApiHandler.send({ type: 'START' });
    rejectApiHandler.on('message', (msg) => {
      switch (msg.type) {
        case 'REQ_SENT':
          apiResp({
            uuid: msg.uuid,
            apiRes: msg.apiRes,
          });
          break;

        default:
          break;
      }
    });

    eventWatcher.startWatch();
  })
  .catch((err) => {
    console.error('APP_START_ERROR', err.stack);
    appErrorLog({
      message: { text: 'APP_START_ERROR', error: err.stack },
    });
  });

const stopAPP = () => {
  forked.kill();
  rejectApiHandler.kill();
  watch.stopWatcher();
};

module.exports = { stopAPP };
