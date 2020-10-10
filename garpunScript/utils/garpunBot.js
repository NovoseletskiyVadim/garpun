const TelegramBot = require('node-telegram-bot-api');
const { models } = require('./../db/dbConnect').sequelize;
const bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

bot.onText(/\/stat (.+)/, function (msg, match) {
  var fromId = msg.from.id; // Получаем ID отправителя
  var resp = match[1]; // Получаем текст после /echo
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
});
let userList = [];

bot.onText(/\/reg (.+)/, function (msg, match) {
  var fromId = msg.from.id; // Получаем ID отправителя
  console.log(msg);
  // var resp = match[1]; // Получаем текст после /echo
  // if (resp === 'save') {
  //   userList.push(fromId);
  // }
  bot.sendMessage(fromId, 'Reg ok');
});

const alarmSignal = (msg) => {
  bot.sendMessage(userList[0], 'Received your message');
};

module.exports = { alarmSignal };
