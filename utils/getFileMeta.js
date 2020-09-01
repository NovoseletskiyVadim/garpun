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
  if (eventName !== `VEHICLE_DETECTION`) {
    return false;
  }
  if (plateNumber.length < 4) {
    return false;
  }
  const dateInFormat = moment(date, 'YYYYMMDDHHmmssSSS', true);
  const isValidData = dateInFormat.isValid();
  if (!isValidData) {
    return false;
  }
  const eventDate = dateInFormat.format('YYYY-MM-DDTHH:mm:ss.SSSZ');

  return {
    uuid,
    eventDate,
    cameraName,
    plateNumber,
    file: {
      fullPath: pathFile,
      dir,
      name,
      ext,
    },
  };
};
