const PendingList = require('../../models/pendingList');
const CamEvents = require('../../models/camEvent');
const jsonSender = require('../jsonSender/jsonSender');
const jsonCreator = require('../jsonSender/jsonCreator');
const appLogger = require('./../logger/appLogger');
const logTypes = require('./../logger/logTypes');

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
      jsonSender(jsonToSend)
        .then((result) => {
          const { isSent, apiResponse } = result;
          dataToLocalDB.apiResponse = apiResponse;
          dataToLocalDB.uploaded = isSent;
          CamEvents.create(dataToLocalDB)
            .then((res) => {
              appLogger.printLog(logTypes.JSON_SENT, {
                sender: 'SENT',
                camera: dataToLocalDB.camera,
                apiResponse: dataToLocalDB.apiResponse,
                fileName: dataToLocalDB.fileName,
              });
            })
            .catch((error) => {
              appLogger.printLog(logTypes.APP_ERROR, {
                errorType: 'DB_ERROR',
                errorData: error.stack,
              });
            });
        })
        .catch((error) => {
          appLogger.printLog(logTypes.API_ERROR, {
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
            appLogger.printLog('APP_ERROR', {
              errorType: 'EVENTHANDLER_ERROR',
              errorData: error.stack,
            });
          });
        });
    })
    .catch((error) => {
      appLogger.printLog('APP_ERROR', {
        errorType: 'EVENTHANDLER_ERROR',
        errorData: error.stack,
      });
    });
};
