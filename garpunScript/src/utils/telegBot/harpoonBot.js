const axios = require('axios');

const config = require('../../common/config');
const jsonResendAlertScheduler = require('../jsonResenderProcess/alertScheduler');

const telegramIcons = {
    API_OK: '\xF0\x9F\x9A\x80',
    API_ERROR: '\xE2\x9B\x94',
    JSON_RESENDER: '\xE2\x8F\xB3',
    CAMERA_ONLINE: '\xE2\x9C\x85',
    CAMERA_OFFLINE: '\xE2\x9D\x8C',
    APP_START: '\xF0\x9F\x94\xB1',
};

const alarmSignal = (msg) => {
    const usersMsgReq = config.USER_LIST.map((user) =>
        axios
            .get(
                `https://api.telegram.org/bot${process.env.BOT_TOKEN}/sendMessage?chat_id=${user}&text=${msg}&parse_mode=HTML`
            )
            .catch((error) => {
                console.error(error.message);
            })
    );
    return Promise.all(usersMsgReq);
};

const appStartAlert = () => {
    const isDevMode = process.env.NODE_ENV === 'DEV' ? 'DEV' : '';
    const msg = `Resender_a ${isDevMode} launched ${telegramIcons.APP_START}`;
    alarmSignal(msg);
};

const sendManyMessages = (msgArr) => {
    if (Array.isArray(msgArr)) {
        let i = 0;
        const arrLength = msgArr.length;
        // eslint-disable-next-line no-inner-declarations
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
    const { isBigQueue, shouldSent, deliveredAlerts } =
        jsonResendAlertScheduler(count, alertsHistory);
    if (shouldSent) {
        if (count === 0) {
            alarmSignal(`API_OK ${telegramIcons.API_OK}`);
        } else {
            alarmSignal(`${textMsg} ${telegramIcons.JSON_RESENDER}`);
        }
    }
    return { deliveredAlerts, isBigQueue };
};

module.exports = {
    alarmSignal,
    appStartAlert,
    sendManyMessages,
    jsonReSenderCalcAlert,
    telegramIcons,
};
