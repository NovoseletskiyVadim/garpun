'use strict';
const { models } = require('./../db/dbConnect').sequelize;
const jsonSender = require('./jsonSender');
const { appErrorLog } = require('./logger');

console.log(`RejectApiHandler started ID:${process.pid}`);

const MAX_TIMEOUT = 100000;
let interval = 5000;
let limit = 10;

const resend = () => {
  const restart = () => {
    setTimeout(() => {
      if (interval < MAX_TIMEOUT) {
        resend();
      } else {
        interval = MAX_TIMEOUT;
        resend();
      }
    }, interval);
  };

  models.pendingList
    .findAndCountAll({ limit: limit })
    .then((result) => {
      const { count, rows } = result;
      if (rows.length === 0) {
        interval = 5000;
        limit = 10;
        restart();
      } else {
        console.log(
          '\x1b[33m%s\x1b[0m',
          `WAITING_REQUESTS_COUNT: ${count} WAIT_TIMEOUT: ${interval}`
        );
        const requests = rows.map((item) => {
          return jsonSender(item.data)
            .then((result) => {
              const { isSent, apiResponse } = result;
              const destroy = models.pendingList.destroy({
                where: {
                  id: item.id,
                },
              });
              const update = models.camEvents
                .findOne({
                  where: {
                    uuid: item.dbID,
                  },
                })
                .then((item) => {
                  return item.update({
                    uploaded: isSent,
                    apiResponse: apiResponse,
                  });
                });
              Promise.all([destroy, update])
                .then((result) => {
                  const eventData = result[1].dataValues;
                  process.send({
                    type: 'REQ_SENT',
                    uuid: eventData.uuid,
                    apiRes: {
                      status: eventData.apiResponse.status || false,
                      statusCode: eventData.apiResponse.error
                        ? apiResponse.error.statusCode
                        : false,
                      message: eventData.apiResponse,
                    },
                  });
                  console.log(
                    '\x1b[32m%s\x1b[0m',
                    `RESEND camera:${eventData.camera} photo:${
                      eventData.fileName
                    } API_RES:${
                      eventData.apiResponse.status ||
                      JSON.stringify(eventData.apiResponse.error)
                    }`
                  );
                })
                .catch((err) => {
                  console.error('RESENDER_DB_ERR', err);
                });
            })
            .catch((error) => {
              let errorMsg = `RESENDER_ERROR_REQUEST ${
                error.statusCode > 0 ? error.statusCode : ''
              } ${error.errorText} UPL:${error.apiURL} eventID:${item.dbID}`;
              console.log('\x1b[31m%s\x1b[0m', errorMsg);
              appErrorLog({
                message: errorMsg,
              });
            });
        });
        Promise.all(requests)
          .then((result) => {
            if (limit < 10) {
              limit++;
            }
            interval = 5000;
            restart();
          })
          .catch((e) => {
            limit = 1;
            if (limit === 1) {
              interval *= 2;
            }
            restart();
          });
      }
    })
    .catch((err) => {
      console.log('RESEND', errorMsg);
    });
};

resend();
