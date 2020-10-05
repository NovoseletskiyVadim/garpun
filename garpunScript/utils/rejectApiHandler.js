'use strict';
const { models } = require('./../db/dbConnect').sequelize;
const jsonSender = require('./jsonSender');
process.send(`rejectApiHandler started`);

let interval = 5000;
let limit = 10;

const resend = () => {
  const restart = () => {
    setTimeout(() => {
      if (interval < 100000) {
        resend();
      } else {
        interval = 100000;
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
        process.env.NODE_ENV === 'DEV' &&
          process.send({
            pendingEvents: count,
            Pending_interval: interval,
            rows_limit: limit,
          });
        const requests = rows.map((item) => {
          return jsonSender(item.data, item.fileMeta).then((result) => {
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
                  uploaded: true,
                  apiResponse: result.apiResponse,
                });
              });
            Promise.all([destroy, update])
              .then((result) => {
                const eventData = result[1].dataValues;
                console.log(
                  `RESEND camera:${eventData.camera} photo:${
                    eventData.fileName
                  } API_RES:${
                    eventData.apiResponse.status ||
                    JSON.stringify(eventData.apiResponse.error)
                  }`
                );
              })
              .catch((err) => {
                console.error('DB_ERR', err);
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
      console.log(err);
    });
};

resend();
