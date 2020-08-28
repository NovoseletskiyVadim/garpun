'use strict';
const path = require('path');
const fs = require('fs');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { CamEvent } = require('./../db/dbConnect');
const jsonSender = require('./jsonSender');
const convertor = require('./base64Convertor');

module.exports = (pathFile) => {
  const parsedPath = path.parse(pathFile);
  const splittedPath = parsedPath.dir.split(path.sep);
  const cameraName = splittedPath[splittedPath.length - 1];
  const fileName = parsedPath.name;
  const [date, plateNumber, ...rest] = fileName.split('_');
  const eventName = rest.join('_');
  const formattedDate = moment(date, 'YYYYMMDDhhmmss').format();
  const uuid = uuidv4();
  if (eventName === `VEHICLE_DETECTION`) {
    convertor(pathFile).then((fileData) => {
      jsonSender({ cameraName, plateNumber, formattedDate, uuid, fileData })
        .then((result) => {
          let eventData = {
            uuid,
            time: formattedDate,
            license_plate_number: plateNumber,
            camera: cameraName,
          };
          if (result) {
            eventData.uploaded = true;
          }
          CamEvent.create(eventData).then((result) => {
            fs.unlink(pathFile, (err) => {
              if (err) throw err;
              console.log(`${pathFile} was deleted`);
            });
          });
        })
        .catch((err) => {
          console.log('REQUEST_REJECTED', err.message);
        });
    });
  } else {
    console.error('ERROR_EVENT_NAME');
  }
};
