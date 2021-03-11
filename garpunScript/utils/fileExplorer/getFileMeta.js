const path = require('path');

const { v4: uuidv4 } = require('uuid');
const moment = require('moment');
const TIME_OUT_OF_SYNC = 180000; //allowed max 2 minutes;

module.exports = (pathFile) => {
  const timeNow = moment().local();
  const uuid = uuidv4();
  const { dir, name, ext } = path.parse(pathFile);
  const splittedPath = dir.split(path.sep);
  const cameraName = splittedPath[splittedPath.length - 1];
  const fileName = name;
  const [date, plateNumber, ...rest] = fileName.split('_');
  const eventName = rest.join('_');
  const plateNumberRegX = /^[a-zA-ZА-Я0-9\\-]{3,8}$/;
  const noPlate = 'noPlate';
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
  if (
    !plateNumber ||
    !plateNumberRegX.test(plateNumber) ||
    plateNumber === noPlate
  ) {
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
    const camTime = timeNow - dateInFormat;
    if (camTime > TIME_OUT_OF_SYNC || camTime < 0) {
      fileMeta.notPassed.push('CAM_TIME_SYNC');
      // fileMeta.isValid = false;
    }
    fileMeta.eventDate = dateInFormat.format('YYYY-MM-DDTHH:mm:ss.SSSZ');
  }
  return fileMeta;
};
