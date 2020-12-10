// 00 09 * * * cd  /home/garpun/appGarpun/garpunScript/utils && /usr/bin/node   sendDailyReport.js

const Sequelize = require('sequelize');
const { Op } = require('sequelize');
const axios = require('axios');
const moment = require('moment');
require('dotenv').config({ path: './../../.env' });
const { appErrorLog } = require('./../logger');

const sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: './../../db/garpun.db',
  logging: false, // Disables logging
});

require('./../../models/camEvent')(sequelize);
require('./../../models/users')(sequelize);

const today = moment().format('YYYY-MM-DD');
const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

const events = sequelize.models.camEvents.findAll({
  raw: true,
  where: {
    createdAt: {
      [Op.between]: [
        moment(`${yesterday} 09:00:00`).local(),
        moment(`${today} 08:59:59`).local(),
      ],
    },
  },
});

const usersList = sequelize.models.userList.findAll({ raw: true });

Promise.all([events, usersList]).then((values) => {
  const [events, usersList] = values;
  let filteredByCam = {};
  let msg = '<b>Garpun daily stat as of 9:00AM</b> \n ';
  if (Array.isArray(events)) {
    events.forEach((event) => {
      if (!filteredByCam.hasOwnProperty(event.camera)) {
        filteredByCam[event.camera] = 0;
      }
      filteredByCam[event.camera] += 1;
    });

    Object.keys(filteredByCam).forEach((camera) => {
      msg += `\n ${camera}: <b>${filteredByCam[camera]} events</b>`;
    });
  }
  if (Array.isArray(usersList)) {
    usersList.forEach((user) => {
      if (user.chatMsgOn) {
        axios
          .get(
            `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=${user.chatID}&text=${msg}&parse_mode=html`
          )
          .catch((error) => {
            appErrorLog({ message: { text: 'STAT_BOT_ERROR', error } });
          });
      }
    });
  }
});
