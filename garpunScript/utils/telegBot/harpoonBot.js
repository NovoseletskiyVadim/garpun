const axios = require('axios');
const { models } = require('../../db/dbConnect').sequelize;
const jsonResendAlertScheduler = require('./rejectApiAlertScheduler');

const telegramIcons = {
  API_OK: '\xF0\x9F\x9A\x80',
  API_ERROR: '\xE2\x9B\x94',
};
const startBot = () => {
  const TelegramBot = require('node-telegram-bot-api');
  const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });
  bot.onText(/\/stat (.+)/, function (msg, match) {
    console.log('rere');
    var fromId = msg.from.id;
    var resp = match[1];
    if (resp === 'pend') {
      models.pendingList
        .count()
        .then((result) => {
          bot.sendMessage(fromId, `Pending events count: ${result}`);
        })
        .catch((err) => {
          console.log(err);
        });
    }
    if (resp === 'Cherk_park_50') {
      models.camEvents
        .findAndCountAll({
          where: {
            camera: 'Cherk_park_50',
          },
        })
        .then((result) => {
          bot.sendMessage(fromId, `${JSON.stringify(result)}`);
        })
        .catch((err) => {
          console.log(err);
        });
    }
  });
  let userList = [];

  bot.onText(/\/reg (.+)/, function (msg, match) {
    var fromId = msg.from.id; // Получаем ID отправителя
    console.log('bot', msg);
    // var resp = match[1]; // Получаем текст после /echo
    // if (resp === 'save') {
    //   userList.push(fromId);
    // }
    bot.sendMessage(fromId, 'Reg ok');
  });
};

const signedUsersList = process.env.USER_LIST.split(',');
let apiStatus = 200;

const alarmSignal = (msg) => {
  signedUsersList.forEach((user) => {
    axios
      .get(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=${user}&text=${msg}`
      )
      .catch((error) => {
        console.error(error.message);
      });
  });
};

const apiErrorAlarm = (apiState) => {
  const msgType = apiState.statusCode === 200 ? 'API_OK' : 'API_ERROR';
  const statusCode = apiState.statusCode > 0 ? apiState.statusCode : '';
  const msgIcon = telegramIcons[msgType];
  const msg = `${msgType} ${statusCode} ${
    apiState.statusMessage || ''
  } ${msgIcon}`;
  alarmSignal(msg);
};

const jsonReSenderCalcAlert = (textMsg, count, alertsHistory) => {
  const schedulerResult = jsonResendAlertScheduler(count, alertsHistory);
  console.log(schedulerResult);
};

module.exports = {
  alarmSignal,
  apiErrorAlarm,
  jsonReSenderCalcAlert,
  startBot,
};
