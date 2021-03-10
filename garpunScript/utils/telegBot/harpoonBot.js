const axios = require('axios');

const jsonResendAlertScheduler = require('./jsonReSenderAlertScheduler.js');

const telegramIcons = {
  API_OK: '\xF0\x9F\x9A\x80',
  API_ERROR: '\xE2\x9B\x94',
  JSON_RESENDER: '\xE2\x8F\xB3',
  CAMERA_ONLINE: '\xE2\x9C\x85',
  CAMERA_OFFLINE: '\xE2\x9D\x8C',
  API_OK: '\xF0\x9F\x9A\x80',
  APP_START: '\xF0\x9F\x94\xB1',
};

const signedUsersList = process.env.USER_LIST.split(',');

const alarmSignal = (msg) => {
  const usersMsgReq = signedUsersList.map((user) => {
    return axios
      .get(
        `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=${user}&text=${msg}&parse_mode=HTML`
      )
      .catch((error) => {
        console.error(error.message);
      });
  });
  return Promise.all(usersMsgReq);
};

const appStartAlert = () => {
  const msg = `Harpoon launched ${telegramIcons.APP_START}`;
  alarmSignal(msg);
};

const sendManyMessages = (msgArr) => {
  if (Array.isArray(msgArr)) {
    let i = 0;
    const arrLength = msgArr.length;
    function startQuery() {
      return alarmSignal(`<i>${i + 1}\\${arrLength}</i>\n${msgArr[i]}`)
        .then(() => {
          i += 1;
          if (i < arrLength) {
            startQuery();
          }
        })
        .catch((err) => {
          console.error(err);
        });
    }
    startQuery();
  }
};

const jsonReSenderCalcAlert = (textMsg, count, alertsHistory) => {
  const schedulerResult = jsonResendAlertScheduler(count, alertsHistory);
  if (schedulerResult.shouldSent) {
    if (count === 0) {
      alarmSignal(`API_OK ${telegramIcons.API_OK}`);
    } else {
      alarmSignal(`${textMsg} ${telegramIcons.JSON_RESENDER}`);
    }
  }
  return schedulerResult.deliveredAlerts;
};

module.exports = {
  alarmSignal,
  appStartAlert,
  sendManyMessages,
  jsonReSenderCalcAlert,
  telegramIcons,
};
