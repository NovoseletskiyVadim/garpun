const moment = require('moment');

const {
  jsonReSenderCalcAlert,
  telegramIcons,
  alarmSignal,
} = require('../telegBot/harpoonBot');
const { appErrorLog } = require('./logToFile');
const logTypes = require('./logTypes');

let resenderAlertsHistory = {
  deliveredAlerts: [],
  lastCount: 0,
  isBigQueue: false,
};

module.exports = {
  logTypes,
  printLog: function (type, loggerData) {
    const colorTypes = {
      warning: '\x1b[33m%s\x1b[0m',
      successful: '\x1b[32m%s\x1b[0m',
      error: '\x1b[31m%s\x1b[0m',
      errorSecond: '\x1b[1;31m%s\x1b[0m',
      info: '\x1b[36m%s\x1b[0m',
    };
    let textMsg = '';
    switch (type) {
      case logTypes.APP_INFO:
        console.log(colorTypes.info, loggerData);
        break;

      case logTypes.INFO_RESENDER:
        const { count, interval, limit, countOfSent } = loggerData;
        const alertsHistory = resenderAlertsHistory;
        textMsg = `WAITING_REQUESTS_COUNT: ${count} REQUEST_LIMIT: ${limit} ${
          countOfSent ? `COUNT_OF_SENT: ${countOfSent}` : ''
        } WAIT_TIMEOUT: ${interval}`;
        if (alertsHistory.lastCount !== count) {
          console.log(colorTypes.warning, textMsg);
          const { deliveredAlerts, isBigQueue } = jsonReSenderCalcAlert(
            textMsg,
            count,
            alertsHistory
          );
          resenderAlertsHistory.deliveredAlerts = deliveredAlerts;
          resenderAlertsHistory.isBigQueue = isBigQueue;
        }
        resenderAlertsHistory.lastCount = count;
        break;

      case logTypes.WRONG_FILE:
        console.log(colorTypes.error, loggerData);
        break;

      case logTypes.JSON_SENT:
        let { camera, apiResponse, fileName, sender, time, warning } =
          loggerData;
        try {
          const eventTime = moment(time);
          const apiRespTime = moment(apiResponse.datetime);
          const delayTimeInMs = apiRespTime - eventTime;
          const minutes = Math.floor(delayTimeInMs / 60000);
          const seconds = ((delayTimeInMs % 60000) / 1000).toFixed(0);
          const delayTime = `${minutes}m${seconds}s`;
          textMsg = `${sender} camera:${camera} photo:${fileName} API_RES:${
            apiResponse.status || JSON.stringify(apiResponse.error)
          } ${delayTime}`;
          let color = colorTypes.successful;
          if (warning) {
            color = colorTypes.warning;
          }
          console.log(color, textMsg);
        } catch (error) {
          console.error(loggerData);
          // console.error(errorType, error);
        }
        break;

      case logTypes.API_ERROR:
        let { statusCode, errorText, apiURL, senderName, cameraName, file } =
          loggerData;
        textMsg = `${senderName}_API_ERROR ${
          (statusCode, errorText)
        } UPL:${apiURL} camera: ${cameraName} fileName: ${file}`;
        console.log(colorTypes.errorSecond, textMsg);
        break;

      case logTypes.APP_ERROR:
        const { errorType, errorData } = loggerData;
        console.error(errorType, errorData);
        appErrorLog({
          message: { errorType, error: errorData },
        });
        break;

      case logTypes.CAMERA_OFFLINE:
        textMsg = `CAMERA ${loggerData.name} ${loggerData.timeInOffline} OFFLINE`;
        alarmSignal(`${textMsg} ${telegramIcons.CAMERA_OFFLINE}`);
        console.log(colorTypes.errorSecond, textMsg);
        break;

      case logTypes.CAMERA_ONLINE:
        const timeOff = `, OFFLINE ${loggerData.timeInOffline}`;
        textMsg = `CAMERA ${loggerData.name} ONLINE${
          loggerData.timeInOffline !== 0 ? timeOff : ''
        }`;
        alarmSignal(`${textMsg} ${telegramIcons.CAMERA_ONLINE}`);
        console.log(colorTypes.successful, textMsg);
        break;
      default:
        break;
    }
  },
};
