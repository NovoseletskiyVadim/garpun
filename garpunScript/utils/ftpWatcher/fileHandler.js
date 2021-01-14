const PendingList = require('../../models/pendingList');
const CamEvents = require('../../models/camEvent');
const jsonSender = require('../jsonSender/jsonSender');
const jsonCreator = require('../jsonSender/jsonCreator');
const { appErrorLog } = require('../logger/appLog');
const { apiErrorAlarm } = require('../telegBot/harpoonBot');
const Logger = require('./../logger/appLog');
const logTypes = require('./../logger/logTypes');

module.exports = (fileMeta) => {
  const logger = Logger();
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
      jsonSender(jsonToSend)
        .then((result) => {
          apiErrorAlarm(200);
          const { isSent, apiResponse } = result;
          dataToLocalDB.apiResponse = apiResponse;
          dataToLocalDB.uploaded = isSent;
          CamEvents.create(dataToLocalDB)
            .then((res) => {
              logger(logTypes.JSON_SENT, {
                sender: 'SENT',
                camera: dataToLocalDB.camera,
                apiResponse: dataToLocalDB.apiResponse,
                fileName: dataToLocalDB.fileName,
              });
              // if (isSent) {
              //   console.log(
              //     '\x1b[32m%s\x1b[0m',
              //     `camera:${} photo:${dataToLocalDB.fileName} API_RES:${dataToLocalDB.apiResponse.status}`
              //   );
              // } else {
              //   console.log(
              //     '\x1b[31m%s\x1b[0m',
              //     `camera:${dataToLocalDB.camera} photo:${
              //       dataToLocalDB.fileName
              //     } API_RES:${JSON.stringify(dataToLocalDB.apiResponse.error)}`
              //   );
              // }
            })
            .catch((error) => {
              logger(logTypes.APP_ERROR, {
                errorType: 'DB_ERROR',
                errorData: error.stack,
              });
            });
        })
        .catch((error) => {
          logger(logTypes.API_ERROR, {
            statusCode: error.statusCode,
            errorText: error.errorText,
            apiURL: error.apiURL,
            senderName: 'SEND',
            cameraName: dataToLocalDB.camera,
            file: dataToLocalDB.fileName,
          });
          const savePending = PendingList.create({
            status: 'API_ERROR',
            data: jsonToSend,
            dbID: dataToLocalDB.uuid,
            fileMeta,
          });
          const saveCamEvent = CamEvents.create(dataToLocalDB);
          Promise.all([savePending, saveCamEvent]).catch((error) => {
            logger('APP_ERROR', {
              errorType: 'EVENTHANDLER_ERROR',
              errorData: error.stack,
            });
          });
        });
    })
    .catch((error) => {
      logger('APP_ERROR', {
        errorType: 'EVENTHANDLER_ERROR',
        errorData: error.stack,
      });
    });
};
