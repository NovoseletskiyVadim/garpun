'use strict';
const moment = require('moment');
const socketMsgSender = require('../socketIO');
const { models } = require('./../db/dbConnect').sequelize;
const jsonSender = require('./jsonSender');
const jsonCreator = require('./jsonCreator');
const { appErrorLog } = require('./logger');
const { apiErrorAlarm } = require('./harpoonBot');

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
      socketMsgSender.newEvent({
        uuid,
        eventTime: moment(fileMeta.eventDate).format('YYYY-MM-DD HH:mm:ss'),
        cameraName: fileMeta.cameraName,
        plateNumber: fileMeta.plateNumber,
        fileName: fileMeta.file.name,
        isErrors: [],
        filePath: `/images/files_archive/${
          fileMeta.cameraName
        }/${moment().format('YYYYMMDD')}/${
          fileMeta.file.name + fileMeta.file.ext
        }`,
      });
      jsonSender(jsonToSend, fileMeta)
        .then((result) => {
          apiErrorAlarm(200);
          const { isSent, apiResponse } = result;
          dataToLocalDB.apiResponse = apiResponse;
          dataToLocalDB.uploaded = isSent;
          models.camEvents
            .create(dataToLocalDB)
            .then((res) => {
              if (isSent) {
                console.log(
                  '\x1b[32m%s\x1b[0m',
                  `camera:${dataToLocalDB.camera} photo:${dataToLocalDB.fileName} API_RES:${dataToLocalDB.apiResponse.status}`
                );
              } else {
                console.log(
                  '\x1b[31m%s\x1b[0m',
                  `camera:${dataToLocalDB.camera} photo:${
                    dataToLocalDB.fileName
                  } API_RES:${JSON.stringify(dataToLocalDB.apiResponse.error)}`
                );
              }
              socketMsgSender.apiResp({
                uuid,
                apiRes: {
                  status: apiResponse.status || false,
                  statusCode: apiResponse.error
                    ? apiResponse.error.statusCode
                    : false,
                  message: apiResponse,
                },
              });
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
          let errorMsg = `API_ERROR ${
            error.statusCode > 0 ? error.statusCode : ''
          } ${error.errorText} UPL:${error.apiURL} camera:${
            dataToLocalDB.camera
          }, photo:${dataToLocalDB.fileName}`;
          apiErrorAlarm(error.statusCode);
          console.log('\x1b[31m%s\x1b[0m', errorMsg);
          socketMsgSender.apiResp({
            uuid,
            apiRes: {
              statusCode: error.statusCode,
              message: error.errorText,
            },
          });
          models.pendingList.create({
            status: 'API_ERROR',
            data: jsonToSend,
            dbID: dataToLocalDB.uuid,
            fileMeta,
          });
          appErrorLog({
            message: errorMsg,
          });
          models.camEvents.create(dataToLocalDB).catch((error) => {
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
