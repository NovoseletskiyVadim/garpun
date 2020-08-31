'use strict';
const fs = require('fs');
const path = require('path');
const saveDetectEvent = (eventData) => {
  const { time, plateNumber, eventName } = eventData;
  const stream = fs.createWriteStream(
    path.join(__dirname, '../logs/VEHICLE_DETECTION.log'),
    { flags: 'a' }
  );
  stream.write(
    `${JSON.stringify({
      time,
      plateNumber,
      eventName,
    })}\n`
  );
  stream.end();
};

const saveErrorEvent = (eventData) => {
  const { message } = eventData;
  const stream = fs.createWriteStream(
    path.join(__dirname, '../logs/error.log'),
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

const removeFileLog = (eventData) => {
  const { pathFile } = eventData;
  const stream = fs.createWriteStream(
    path.join(__dirname, '../logs/removed.log'),
    { flags: 'a' }
  );
  stream.write(
    `${JSON.stringify({
      time: new Date(),
      path: pathFile,
    })}\n`
  );
  stream.end();
};

module.exports = { saveDetectEvent, saveErrorEvent, removeFileLog };
