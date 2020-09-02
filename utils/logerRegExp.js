'use strict';
const fs = require('fs');
const path = require('path');





const saveDetectEvent = (RegExpArray) => {
  const [ full_inform, time, plateNumber, eventName ] = RegExpArray;

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

const saveErrorEvent = (RegExpArray,err) => {
  const error=err;  
  const [ full_inform, time, plateNumber, eventName ] = RegExpArray;
  const stream = fs.createWriteStream(
    path.join(__dirname, '../logs/error.log'),
    { flags: 'a' }
  );
  stream.write(
    `${JSON.stringify({
        time,
        plateNumber,
        eventName,
        error
    })}\n`
  );
  stream.end();
};



module.exports = { saveDetectEvent, saveErrorEvent};
