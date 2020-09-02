'use strict';
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

module.exports = (pathFile) => {
  const uuid = uuidv4();
  const { dir, name, ext } = path.parse(pathFile);
  const splittedPath = dir.split(path.sep);
  const cameraName = splittedPath[splittedPath.length - 1];
  const fileName = name;
  const [date, plateNumber, ...rest] = fileName.split('_');
  const eventName = rest.join('_');
  const plateNumberRegX = /^[a-zA-ZА-Я0-9]{4,8}$/;
  let fileMeta = {
    uuid,
    isValid: true,
    notPassed: [],
    cameraName,
    file: {
      fullPath: pathFile,
      dir,
      name,
      ext,
    },
  };
  if (eventName !== `VEHICLE_DETECTION`) {
    fileMeta.isValid = false;
    fileMeta.notPassed.push('EVENT_NAME');
  }
  if (!plateNumber || !plateNumberRegX.test(plateNumber)) {
    fileMeta.isValid = false;
    fileMeta.notPassed.push('PLATE_NUMBER');
  } else {
    fileMeta.plateNumber = plateNumber;
  }

  const dateInFormat = moment(date, 'YYYYMMDDHHmmssSSS', true);
  const isValidData = dateInFormat.isValid();
  if (!isValidData) {
    fileMeta.isValid = false;
    fileMeta.notPassed.push('TIME_STAMP');
  } else {
    fileMeta.eventDate = dateInFormat.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  }

  return fileMeta;
};
