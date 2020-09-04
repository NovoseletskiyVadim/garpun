'use strict';
const { models } = require('../../db/dbConnect');
const jsonSender = require('../json/jsonSender');
const jsonCreator = require('../json/jsonCreator');

module.exports = (fileMeta) => {

  const { uuid, eventDate, cameraName, plateNumber, file } = fileMeta;

  const dataToLocalDB = {
    uuid: uuid,
    time: eventDate,
    license_plate_number: plateNumber,
    camera: cameraName,
  };

  jsonCreator({
    cameraName,
    plateNumber,
    datetime: eventDate,
    uuid,
    pathFile: file.fullPath,
  })
    .then((jsonToSend) => {
      jsonSender(jsonToSend)
        .then((result) => {
          if (result) {
            dataToLocalDB.uploaded = true;
          }
          models.camEvents.create(dataToLocalDB);
        })
        .catch((err) => {
          const status = 'REQUEST_REJECTED';
          models.pendingList.create({
            status,
            data: jsonToSend,
            dbID: dataToLocalDB.uuid,
          });
          models.camEvents.create(dataToLocalDB);
          // console.log('REQUEST_REJECTED', err.message);
        });
    })
    .catch((err) => {
      console.error('file', err);
    });
};
