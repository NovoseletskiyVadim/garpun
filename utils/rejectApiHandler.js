'use strict';
const { models } = require('./../db/dbConnect');
const jsonSender = require('./jsonSender');

process.send('rejectApiHandler ok');

let interval = 5000;
let limit = 10;

const resend = () => {
  models.pendingList.findAll({ limit: limit }).then((list) => {
    process.send('Pending events' + list.length);
    if (list.length === 0) {
      interval = 5000;
      limit = 10;
    }
    const requests = list.map((item) => {
      return jsonSender(item.data).then((result) => {
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
    if (requests.length > 0) {
      Promise.all(requests)
        .then((result) => {
          if (limit < 10) {
            limit++;
          }
          interval = 5000;
        })
        .catch((e) => {
          limit = 1;
          if (limit === 1) {
            interval *= 2;
          }
        });
    }
  });
  process.send('Pending_interval' + interval);
  process.send('List_limit' + limit);
  setTimeout(() => {
    if (interval < 100000) {
      resend();
    } else {
      interval = 5000;
      resend();
    }
  }, interval);
};

setTimeout(() => {
  resend();
}, interval);
