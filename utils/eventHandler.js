'use strict';
const path = require('path');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { CamEvent } = require('./../db/dbConnect');
module.exports = (pathFile) => {
  const parsedPath = path.parse(pathFile);
  const splittedPath = parsedPath.dir.split(path.sep);
  const cameraName = splittedPath[splittedPath.length - 1];
  const fileName = parsedPath.name;
  const [date, plateNumber, ...rest] = fileName.split('_');
  const eventName = rest.join('_');
  const formatedDate = moment(date, 'YYYYMMDDhhmmss').format();
  const uuid = uuidv4();
  if (eventName === `VEHICLE_DETECTION`) {
    CamEvent.create({
      uuid,
      time: formatedDate,
      license_plate_number: plateNumber,
      camera: cameraName,
    }).then((result) => {
      console.log(result.id);
    });
  } else {
    console.error('ERROR_EVENT_NAME');
  }
};
