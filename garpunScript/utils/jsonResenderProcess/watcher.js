const Logger = require('../logger/appLog');
const appLogger = require('../logger/apiLogger');
const logTypes = require('../logger/logTypes');
const logger = Logger();

class RejectWatcher {
  constructor(jsonResend) {
    this.MAX_TIMEOUT = 100000;
    this.MIN_TIMEOUT = 5000;
    this.REQUEST_LIMIT = 10;
    this.currentInterval = this.MIN_TIMEOUT;
    this.limit = 1;
    this.timer;
    this.jsonResend = jsonResend;
    this.calc = 1;
  }
  setDefaultConfig() {
    this.limit = 1;
    this.currentInterval = this.MIN_TIMEOUT;
  }
  setApiErrorConfig() {
    this.limit = 1;
    this.currentInterval *= 2;
    if (this.currentInterval > this.MAX_TIMEOUT) {
      this.currentInterval = this.MAX_TIMEOUT;
    }
  }
  setApiOkConfig() {
    this.limit += 1;
    if (this.limit > this.REQUEST_LIMIT) {
      this.limit = this.REQUEST_LIMIT;
    }
    this.currentInterval = this.MIN_TIMEOUT;
  }
  startWatch() {
    this.timer = setTimeout(() => {
      this.jsonResend(this.limit).then((result) => {
        if (result.hasOwnProperty('count') && result.count === 0) {
          this.setDefaultConfig();
        }
        if (result.hasOwnProperty('apiError')) {
          let { apiError } = result;
          const logData = {
            statusCode: apiError.error.statusCode,
            errorText: apiError.error.errorText,
            apiURL: apiError.error.apiURL,
            senderName: 'RESENDER',
            cameraName: apiError.fileMeta.cameraName,
            file:
              apiError.fileMeta.file.name + '.' + apiError.fileMeta.file.ext,
          };
          logger(logTypes.API_ERROR, logData);
          this.setApiErrorConfig();
        }
        if (result.hasOwnProperty('sentList')) {
          this.setApiOkConfig();
        }
        appLogger.printLog(logTypes.INFO_RESENDER, {
          count: result.count,
          interval: this.currentInterval,
        });
        logger('INFO_RESENDER', {
          count: result.count,
          interval: this.currentInterval,
        });
        this.startWatch();
      });
    }, this.currentInterval);
  }
  stopWatch() {
    clearTimeout(this.timer);
  }
}

module.exports = RejectWatcher;
