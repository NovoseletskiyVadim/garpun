'use strict';
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { CamEvent, PendingList } = require('./../db/dbConnect');
const jsonSender = require('./jsonSender');
const convertor = require('./base64Convertor');
const jsonCreator = require('./jsonCreator');

module.exports = (pathFile) => {
  const parsedPath = path.parse(pathFile);
  const splittedPath = parsedPath.dir.split(path.sep);
  const cameraName = splittedPath[splittedPath.length - 1];
  const fileName = parsedPath.name;
  const [date, plateNumber, ...rest] = fileName.split('_');
  const eventName = rest.join('_');
  const formattedDate = moment(date, 'YYYYMMDDhhmmss').format();
  const uuid = uuidv4();
  const dataToLocalDB = {
    uuid,
    time: formattedDate,
    license_plate_number: plateNumber,
    camera: cameraName,
  };
  if (eventName === `VEHICLE_DETECTION`) {
    jsonCreator({
      cameraName,
      plateNumber,
      formattedDate,
      uuid,
      pathFile,
    })
      .then((jsonToSend) => {
        jsonSender(jsonToSend)
          .then((result) => {
            if (result) {
              dataToLocalDB.uploaded = true;
            }
            CamEvent.create(dataToLocalDB);
          })
          .catch((err) => {
            const status = 'REQUEST_REJECTED';
            PendingList.create({
              status,
              data: jsonToSend,
              dbID: dataToLocalDB.uuid,
            });
            CamEvent.create(dataToLocalDB);
            console.log('REQUEST_REJECTED', err.message);
          });
      })
      .catch((err) => {
        console.error('file', err);
      });
  } else {
    console.error('ERROR_EVENT_NAME');
  }
};
