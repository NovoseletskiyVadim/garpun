'use strict';
const { models } = require('./../db/dbConnect').sequelize;
const jsonSender = require('./jsonSender');
const jsonCreator = require('./jsonCreator');

module.exports = (fileMeta) => {
  const { uuid, eventDate, cameraName, plateNumber, file } = fileMeta;
  const dataToLocalDB = {
    uuid: uuid,
    time: eventDate,
    license_plate_number: plateNumber,
    camera: cameraName,
    fileName: file.name,
  };

  jsonCreator({
    cameraName,
    plateNumber,
    datetime: eventDate,
    uuid,
    pathFile: file.fullPath,
  })
    .then((jsonToSend) => {
      jsonSender(jsonToSend, fileMeta)
        .then((result) => {
          dataToLocalDB.apiResponse = result.apiResponse;
          dataToLocalDB.uploaded = result.uploaded;
          models.camEvents.create(dataToLocalDB).catch((err) => {
            console.error(err);
          });
        })
        .catch((error) => {
          const status = 'REQUEST_REJECTED';
          models.pendingList.create({
            status,
            data: jsonToSend,
            dbID: dataToLocalDB.uuid,
            fileMeta,
          });
          models.camEvents.create(dataToLocalDB);
          console.log('REQUEST_REJECTED', error.message);
        });
    })
    .catch((err) => {
      console.error('file', err);
    });
};
