const TelegramBot = require('node-telegram-bot-api');
const Sequelize = require('sequelize');

require('dotenv').config({ path: './../../.env' });
const appLogger = require('./../logger/appLogger');
const dbConnect = require('../../db/dbConnect');
let bot = new TelegramBot(process.env.BOT_TOKEN, { polling: true });

dbConnect.start().then(() => {
  console.log('df');
});

bot.onText(/\/start/, (msg, match) => {
  console.log('ertertretwertw');
  // 'msg' is the received Message from Telegram
  // 'match' is the result of executing the regexp above on the text content
  // of the message

  const chatId = msg.chat.id;
  // const resp = match[1]; // the captured "whatever"
  console.log(msg.chat.id);
  // send back the matched "whatever" to the chat
  bot.sendMessage(chatId, 'resp');
});

// bot.on('message', function (msg) {
//   let text = msg.text;
//   // Stop, if the message is for a '/help' command.
//   // You may want to use a proper regexp
//   // but for the sake of brevity... :)
//   if (text && text === '/help') return;
//   console.log('sd');
//   // ... snip ...
// });

bot.on('polling_error', (error) => {
  console.log(error.code); // => 'EFATAL'
});

bot.on('webhook_error', (error) => {
  console.log(error.code); // => 'EPARSE'
});

setTimeout(() => {
  bot.sendMessage('388438018', '11111').catch((error) => {
    console.log(error.code); // => 'ETELEGRAM'
    console.log(error.response.body); // => { ok: false, error_code: 400, description: 'Bad Request: chat not found' }
  });
}, 60000);
