'use strict';
const { models } = require('./../db/dbConnect');
const jsonSender = require('./jsonSender');
const jsonCreator = require('./jsonCreator');

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
    eventDate,
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
          console.log('REQUEST_REJECTED', err.message);
        });
    })
    .catch((err) => {
      console.error('file', err);
    });
};
