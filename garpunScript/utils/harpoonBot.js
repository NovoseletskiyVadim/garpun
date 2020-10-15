const axios = require('axios');

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

module.exports = { alarmSignal, apiErrorAlarm };
