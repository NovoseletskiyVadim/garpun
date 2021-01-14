const { alarmSignal } = require('../telegBot/harpoonBot');
const alertScheduler = require('../telegBot/rejectApiAlertScheduler');
const { appErrorLog } = require('./appLoggerToFile');
const logTypes = require('./logTypes');

module.exports = () => {
  let alertsHistory = {
    INFO_RESENDER: { deliveredAlerts: [], lastCount: undefined },
  };
  const colorTypes = {
    warning: '\x1b[33m%s\x1b[0m',
    successful: '\x1b[32m%s\x1b[0m',
    error: '\x1b[31m%s\x1b[0m',
    errorSecond: '\x1b[1;31m%s\x1b[0m',
    info: '\x1b[36m%s\x1b[0m',
  };
  return (type, loggerData) => {
    let textMsg = '';
    switch (type) {
      case logTypes.APP_INFO:
        console.log(colorTypes.info, loggerData);
        break;

      case 'INFO_RESENDER':
        const { count, interval } = loggerData;
        textMsg = `WAITING_REQUESTS_COUNT: ${count} WAIT_TIMEOUT: ${interval}`;
        if (alertsHistory.INFO_RESENDER.lastCount !== count) {
          console.log(colorTypes.warning, textMsg);
          const isShouldSend = alertScheduler(
            count,
            alertsHistory.INFO_RESENDER
          );
          if (isShouldSend) {
            alarmSignal(`${textMsg} \xE2\x8F\xB3`);
          }
        }
        alertsHistory.INFO_RESENDER.lastCount = count;
        break;
      case 'WRONG_FILE':
        console.log(colorTypes.error, loggerData);
        break;
      case logTypes.JSON_SENT:
        let { camera, apiResponse, fileName, sender } = loggerData;
        textMsg = `${sender} camera:${camera} photo:${fileName} API_RES:${
          apiResponse.status || JSON.stringify(apiResponse.error)
        }`;
        console.log(colorTypes.successful, textMsg);
        break;

      case logTypes.API_ERROR:
        let {
          statusCode,
          errorText,
          apiURL,
          senderName,
          cameraName,
          file,
        } = loggerData;
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
      case 'CAMERA_IS_DEAD':
        textMsg = `CAMERA_IS_DEAD ${loggerData}`;
        console.log(colorTypes.errorSecond, textMsg);
        break;
      case logTypes.CAMERA_ONLINE:
        const timeOff = `, OFFLINE ${loggerData.timeInOffline}`;
        textMsg = `CAMERA ${loggerData.name} ONLINE${
          loggerData.timeInOffline !== 0 ? timeOff : ''
        }`;
        console.log(colorTypes.successful, textMsg);
        break;
      default:
        break;
    }
  };
};
