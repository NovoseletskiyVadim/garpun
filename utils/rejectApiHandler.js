'use strict';
const { models } = require('./../db/dbConnect').sequelize;
const jsonSender = require('./jsonSender');
process.send(`rejectApiHandler started with PID ${process.pid}`);

let interval = 5000;
let limit = 10;

const resend = () => {
  const restart = () => {
    setTimeout(() => {
      if (interval < 100000) {
        resend();
      } else {
        interval = 5000;
        resend();
      }
    }, interval);
  };

  models.pendingList
    .findAll({ limit: limit })
    .then((list) => {
      if (list.length === 0) {
        interval = 5000;
        limit = 10;
        restart();
      } else {
        process.send({
          pendingEvents: list.length,
          Pending_interval: interval,
          List_limit: limit,
        });
        const requests = list.map((item) => {
          return jsonSender(item.data, item.fileMeta).then((result) => {
            const destroy = models.pendingList.destroy({
              where: {
                id: item.id,
              },
            });
            const update = models.camEvents.update(
              { uploaded: true },
              {
                where: {
                  uuid: item.dbID,
                },
              }
            );
            Promise.all([destroy, update]).catch((err) => {
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