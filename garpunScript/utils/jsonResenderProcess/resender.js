const jsonSender = require('../jsonSender/jsonSender');
const PendingList = require('../../models/pendingList');
const CamEvents = require('../../models/camEvent');
const { printLog, logTypes } = require('../logger/appLogger');

module.exports = (limitToResend) => {
  let finalResult = {};
  return PendingList.findAndCountAll({ limit: limitToResend })
    .then((result) => {
      const { count, rows } = result;
      finalResult.count = count;
      if (rows.length === 0) {
        return finalResult;
      } else {
        const preparedRequests = rows.map((item) => {
          return new Promise((resolve, reject) => {
            jsonSender(item.data)
              .then((result) => {
                const { isSent, apiResponse } = result;
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
                      apiResponse: apiResponse,
                    });
                  }
                  throw new Error(`CamEvent ID: ${item.dbID} not found`);
                });

                Promise.all([deleteFromPendingList, updateCamEvent])
                  .then((result) => {
                    let eventData = result[1].dataValues;
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
                reject({ error, fileMeta: item.fileMeta });
              });
          });
        });
        return Promise.all(preparedRequests)
          .then((result) => {
            finalResult.sentList = result;
            return finalResult;
          })
          .catch((error) => {
            finalResult.apiError = error;
            return finalResult;
          });
      }
    })
    .catch((err) => {
      printLog(logTypes.APP_ERROR, {
        errorType: 'RESENDER_ERR',
        errorData: err,
      });
    });
};
