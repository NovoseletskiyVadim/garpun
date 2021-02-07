const axios = require('axios');

const jsonResendAlertScheduler = require('./jsonReSenderAlertScheduler.js');

const telegramIcons = {
  API_OK: '\xF0\x9F\x9A\x80',
  API_ERROR: '\xE2\x9B\x94',
  JSON_RESENDER: '\xE2\x8F\xB3',
  CAMERA_ONLINE: '\xE2\x9C\x85',
  CAMERA_OFFLINE: '\xE2\x9D\x8C',
};

const signedUsersList = process.env.USER_LIST.split(',');

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
  if (schedulerResult.shouldSent) {
    alarmSignal(`${textMsg} ${telegramIcons.JSON_RESENDER}`);
  }
  return schedulerResult.deliveredAlerts;
};

module.exports = {
  alarmSignal,
  apiErrorAlarm,
  jsonReSenderCalcAlert,
  telegramIcons,
};
