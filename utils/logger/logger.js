'use strict';
const fs = require('fs');
const path = require('path');

const saveAppError = (eventData) => {
  const { message } = eventData;
  const stream = fs.createWriteStream(
    path.join(__dirname, '../../logs/error.log'),
    { flags: 'a' }
  );
  stream.write(
    `${JSON.stringify({
      time: new Date(),
      message,
    })}\n`
  );
  stream.end();
};

const rejectFileLog = (eventData) => {
  const stream = fs.createWriteStream(
    path.join(__dirname, '../../logs/reject.log'),
    { flags: 'a' }
  );
  stream.write(
    `${JSON.stringify({
      time: new Date(),
      message: eventData.message,
      file: eventData.file,
    })}\n`
  );
  stream.end();
};

module.exports = { rejectFileLog, saveAppError };
