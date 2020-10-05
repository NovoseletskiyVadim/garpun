'use strict';
const moment = require('moment');
const { models } = require('./../db/dbConnect').sequelize;
const jsonSender = require('./jsonSender');
const jsonCreator = require('./jsonCreator');
const { appErrorLog } = require('./logger');

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
    file,
  })
    .then((jsonToSend) => {
      jsonSender(jsonToSend, fileMeta)
        .then((result) => {
          dataToLocalDB.apiResponse = result.apiResponse;
          dataToLocalDB.uploaded = result.uploaded;
          models.camEvents
            .create(dataToLocalDB)
            .then((res) => {
              if (result.uploaded) {
                console.log(
                  `camera:${dataToLocalDB.camera} photo:${dataToLocalDB.fileName} API_RES:${dataToLocalDB.apiResponse.status}`
                );
              } else {
                console.error(
                  `camera:${dataToLocalDB.camera} photo:${
                    dataToLocalDB.fileName
                  } API_RES:${JSON.stringify(dataToLocalDB.apiResponse.error)}`
                );
              }
            })
            .catch((error) => {
              const errorMsg = {
                text: 'DB_ERROR',
                error: error.message,
                stack: error.stack,
              };
              appErrorLog({
                message: errorMsg,
              });
              console.error(errorMsg);
            });
        })
        .catch((error) => {
          let errorMsg;
          if (error.response) {
            errorMsg = `API_ERROR-${error.response.status} ${error.message} ${
              error.response.statusText || error.message
            } UPL:${error.config.url} camera:${dataToLocalDB.camera}, photo:${
              dataToLocalDB.fileName
            }`;
          } else {
            errorMsg = `API_ERROR ${error.message}`;
          }
          console.error(errorMsg);
          const status = 'API_ERROR';
          models.pendingList.create({
            status,
            data: jsonToSend,
            dbID: dataToLocalDB.uuid,
            fileMeta,
          });
          appErrorLog({
            message: errorMsg,
          });
          models.camEvents.create(dataToLocalDB);
        });
    })
    .catch((error) => {
      console.error({
        text: 'EVENTHANDLER_ERROR',
        error: error.message,
        stack: error.stack,
      });
      appErrorLog({
        message: {
          text: 'EVENTHANDLER_ERROR',
          error: error.message,
          stack: error.stack,
        },
      });
    });
};
