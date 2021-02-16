const axios = require('axios');

const jsonResendAlertScheduler = require('./jsonReSenderAlertScheduler.js');

const telegramIcons = {
  API_OK: '\xF0\x9F\x9A\x80',
  API_ERROR: '\xE2\x9B\x94',
  JSON_RESENDER: '\xE2\x8F\xB3',
  CAMERA_ONLINE: '\xE2\x9C\x85',
  CAMERA_OFFLINE: '\xE2\x9D\x8C',
  API_OK: '\xF0\x9F\x9A\x80',
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
  sendManyMessages,
  apiErrorAlarm,
  jsonReSenderCalcAlert,
  telegramIcons,
};
