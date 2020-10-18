const axios = require('axios');
const { models } = require('./../db/dbConnect').sequelize;

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
      .catch(console.error);
  });
};

const apiErrorAlarm = (status) => {
  if (status !== apiStatus) {
    if (status === 200) {
      alarmSignal(`API-OK \xF0\x9F\x9A\x80`);
    } else {
      alarmSignal(
        `API-ERROR ${status > 0 ? status : 'Server not found'} \xE2\x9B\x94`
      );
    }
  }
  apiStatus = status;
};

module.exports = { alarmSignal, apiErrorAlarm, startBot };
