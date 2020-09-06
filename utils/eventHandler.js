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
      jsonSender(jsonToSend)
        .then((result) => {
          const { status } = result.data;
          dataToLocalDB.apiResponse = result.data;
          if (status && status === 'OK') {
            dataToLocalDB.uploaded = true;
          } else {
            // TODO
            console.log('JSON_NOT_WALID');
          }
          models.camEvents.create(dataToLocalDB).catch((err) => {
            console.error(err);
          });
        })
        .catch((err) => {
          console.log(err.response.status);
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
