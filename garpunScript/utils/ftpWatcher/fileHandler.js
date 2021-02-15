const PendingList = require('../../models/pendingList');
const jsonSender = require('../jsonSender/jsonSender');
const jsonCreator = require('../jsonSender/jsonCreator');
const appLogger = require('./../logger/appLogger');
const logTypes = require('./../logger/logTypes');

module.exports = (fileMeta, eventQuery) => {
  const { uuid, eventDate, cameraName, plateNumber, file } = fileMeta;

  return jsonCreator({
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
          const eventData = {
            sender: 'SEND',
            apiResponse,
            camera: cameraName,
            fileName: file.name + file.ext,
            time: eventDate,
          };
          eventQuery.apiResponse = apiResponse;
          eventQuery.uploaded = isSent;
          appLogger.printLog(logTypes.JSON_SENT, eventData);
          return eventQuery.save();
        })
        .catch((error) => {
          appLogger.printLog(logTypes.API_ERROR, {
            statusCode: error.statusCode,
            errorText: error.errorText,
            apiURL: error.apiURL,
            senderName: 'SEND',
            cameraName,
            file: file.name + file.ext,
          });
          return PendingList.create({
            status: 'API_ERROR',
            data: jsonToSend,
            dbID: eventQuery.id,
            fileMeta,
          });
        });
    })
    .catch((error) => {
      const regex = new RegExp('CAMERA_INFO');
      appLogger.printLog('APP_ERROR', {
        errorType: 'EVENTHANDLER_ERROR',
        errorData: error.stack,
      });
      if (regex.test(error.message)) {
        if (eventQuery.fileErrors.length > 0) {
          eventQuery.fileErrors += ',CAMERA_INFO';
        } else {
          eventQuery.fileErrors += 'CAMERA_INFO';
        }
        return eventQuery.save();
      }
    });
};
