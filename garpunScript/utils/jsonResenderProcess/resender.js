const jsonSender = require('../jsonSender/jsonSender');
const PendingList = require('../../models/pendingList');
const CamEvents = require('../../models/camEvent');
const { printLog, logTypes } = require('../logger/appLogger');

module.exports = (limitToResend) => {
  const finalResult = {};
  return PendingList.findAndCountAll({ limit: limitToResend })
    .then((result) => {
      const { count, rows } = result;
      finalResult.count = count;
      if (rows.length === 0) {
        return finalResult;
      }
      const preparedRequests = rows.map(
        (item) =>
          new Promise((resolve, reject) => {
            jsonSender(item.data)
              .then((apiResp) => {
                const { isSent, apiResponse } = apiResp;

                const deleteFromPendingList = PendingList.destroy({
                  where: {
                    id: item.id,
                  },
                });

                const updateCamEvent = CamEvents.findOne({
                  where: {
                    id: item.dbID,
                  },
                }).then((camEvent) => {
                  if (camEvent) {
                    return camEvent.update({
                      uploaded: isSent,
                      apiResponse,
                    });
                  }
                  throw new Error(`CamEvent ID: ${item.dbID} not found`);
                });

                Promise.all([deleteFromPendingList, updateCamEvent])
                  .then((deleteUpdateResults) => {
                    const eventData = deleteUpdateResults[1].dataValues;
                    eventData.sender = 'RESEND';
                    if (!eventData.uploaded || eventData.fileErrors.length) {
                      eventData.warning = true;
                    }
                    printLog(logTypes.JSON_SENT, eventData);
                    resolve(eventData);
                  })
                  .catch((err) => {
                    printLog(logTypes.APP_ERROR, {
                      errorType: 'RESENDER_ERR',
                      errorData: err,
                    });
                  });
              })
              .catch((error) => {
                printLog(logTypes.API_ERROR, {
                  statusCode: error.statusCode,
                  errorText: error.errorText,
                  apiURL: error.apiURL,
                  senderName: 'RESENDER',
                  cameraName: item.fileMeta.cameraName,
                  file: item.fileMeta.file.name + item.fileMeta.file.ext,
                });
                reject(error);
              });
          })
      );
      return Promise.allSettled(preparedRequests).then((reqResults) => {
        finalResult.sentList = reqResults;
        return finalResult;
      });
    })
    .catch((err) => {
      printLog(logTypes.APP_ERROR, {
        errorType: 'RESENDER_ERR',
        errorData: err,
      });
    });
};
