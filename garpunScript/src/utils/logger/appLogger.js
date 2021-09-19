/* eslint-disable no-case-declarations */
const { EOL } = require('os');

const moment = require('moment');

const { AppError } = require('../errorHandlers');

const {
    jsonReSenderCalcAlert,
    telegramIcons,
    alarmSignal,
} = require('../telegBot/harpoonBot');

const botIcons = require('../telegBot/botIcons');
const { appErrorLog } = require('./logToFile');
const logTypes = require('./logTypes');

const resenderAlertsHistory = {
    deliveredAlerts: [],
    lastCount: 0,
    isBigQueue: false,
};

module.exports = {
    logTypes,

    addColor(message) {
        return {
            errorSecond() {
                process.stdout.write(`\x1b[1;31m${message}\x1b[0m`);
            },
            appInfoMessage() {
                process.stdout.write(`\x1b[36m${message}\x1b[0m${EOL}`);
            },
        };
    },

    botIcons,

    printLog(message) {
        return {
            errorSecond() {
                process.stdout.write(`\x1b[1;31m${message}\x1b[0m${EOL}`);
                return this;
            },

            appInfoMessage() {
                process.stdout.write(`\x1b[36m${message}\x1b[0m${EOL}`);
                return this;
            },

            warning() {
                process.stdout.write(`\x1b[33m${message}\x1b[0m${EOL}`);
                return this;
            },

            successful() {
                process.stdout.write(`\x1b[32m${message}\x1b[0m${EOL}`);
                return this;
            },

            error() {
                process.stdout.write(`\x1b[31m${message}\x1b[0m${EOL}`);
                return this;
            },

            toErrorLog() {
                appErrorLog({ messCAMERA_OFFLINEage });
                return this;
            },

            botMessage(iconType) {
                let icon = '';
                if (iconType) {
                    icon = botIcons[iconType];
                }
                alarmSignal(`${message} ${icon}`);
            },
        };
    },

    // printLog(type, loggerData) {
    //     const colorTypes = {
    //         warning: '\x1b[33m%s\x1b[0m',
    //         successful: '\x1b[32m%s\x1b[0m',
    //         error: '\x1b[31m%s\x1b[0m',
    //         errorSecond: '\x1b[1;31m%s\x1b[0m',
    //         info: '\x1b[36m%s\x1b[0m',
    //     };
    //     let textMsg = '';
    //     switch (type) {
    //         case logTypes.APP_INFO:
    //             console.log(colorTypes.info, loggerData);
    //             break;

    //         case logTypes.INFO_RESENDER:
    //             const { count, interval, limit, countOfSent } = loggerData;
    //             const alertsHistory = resenderAlertsHistory;
    //             textMsg = `WAITING_REQUESTS_COUNT: ${count} REQUEST_LIMIT: ${limit} ${
    //                 countOfSent ? `COUNT_OF_SENT: ${countOfSent}` : ''
    //             } WAIT_TIMEOUT: ${interval}`;
    //             if (alertsHistory.lastCount !== count) {
    //                 console.log(colorTypes.warning, textMsg);
    //                 const { deliveredAlerts, isBigQueue } =
    //                     jsonReSenderCalcAlert(textMsg, count, alertsHistory);
    //                 resenderAlertsHistory.deliveredAlerts = deliveredAlerts;
    //                 resenderAlertsHistory.isBigQueue = isBigQueue;
    //             }
    //             resenderAlertsHistory.lastCount = count;
    //             break;

    //         case logTypes.WRONG_FILE:
    //             console.log(colorTypes.error, loggerData);
    //             break;

    //         case logTypes.JSON_SENT:
    //             const { camera, apiResponse, fileName, sender, time, warning } =
    //                 loggerData;
    //             try {
    //                 const eventTime = moment(time);
    //                 const apiRespTime = moment(apiResponse.datetime);
    //                 const delayTimeInMs = apiRespTime - eventTime;
    //                 const minutes = Math.floor(delayTimeInMs / 60000);
    //                 const seconds = ((delayTimeInMs % 60000) / 1000).toFixed(0);
    //                 const delayTime = `${minutes}m${seconds}s`;
    //                 textMsg = `${sender} camera:${camera} photo:${fileName} API_RES:${
    //                     apiResponse.status || JSON.stringify(apiResponse.error)
    //                 } ${delayTime}`;
    //                 let color = colorTypes.successful;
    //                 if (warning) {
    //                     color = colorTypes.warning;
    //                 }
    //                 console.log(color, textMsg);
    //             } catch (error) {
    //                 console.error(loggerData);
    //                 // console.error(errorType, error);
    //             }
    //             break;

    //         case logTypes.API_ERROR:
    //             process.stdout.write(
    //                 `${this.addColor(
    //                     loggerData.printLog()
    //                 ).errorSecond()}${EOL}`
    //             );
    //             console.log(colorTypes.errorSecond, loggerData.printLog());
    //             break;

    //         case logTypes.APP_ERROR:
    //             if (loggerData instanceof AppError) {
    //                 process.stderr.write(
    //                     `${loggerData.printWithColor()}${EOL}`
    //                 );
    //                 appErrorLog({
    //                     message: loggerData.toPrint(),
    //                 });
    //             } else {
    //                 process.stderr.write(JSON.stringify(loggerData));
    //                 appErrorLog({
    //                     message: JSON.stringify(loggerData),
    //                 });
    //             }

    //             break;

    //         case logTypes.CAMERA_OFFLINE:
    //             textMsg = `CAMERA ${loggerData.name} ${loggerData.timeInOffline} OFFLINE`;
    //             alarmSignal(`${textMsg} ${telegramIcons.CAMERA_OFFLINE}`);
    //             console.log(colorTypes.errorSecond, textMsg);
    //             break;

    //         case logTypes.CAMERA_ONLINE:
    //             const timeOff = `, OFFLINE ${loggerData.timeInOffline}`;
    //             textMsg = `CAMERA ${loggerData.name} ONLINE${
    //                 loggerData.timeInOffline !== 0 ? timeOff : ''
    //             }`;
    //             alarmSignal(`${textMsg} ${telegramIcons.CAMERA_ONLINE}`);
    //             console.log(colorTypes.successful, textMsg);
    //             break;
    //         default:
    //             break;

    //     }
    // },
};
