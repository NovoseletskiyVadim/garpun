const appLogger = require('../logger/appLogger');
const logTypes = require('../logger/logTypes');

class RejectWatcher {
  constructor(jsonResend) {
    this.MAX_TIMEOUT = 5000;
    this.MIN_TIMEOUT = 5000;
    this.TIMEOUT_STEP = 5000;
    this.MAX_REQUEST_LIMIT = 50;
    this.MIN_REQUEST_LIMIT = 1;
    this.REQUEST_LIMIT_STEP = 3;

    this.currentInterval = this.MIN_TIMEOUT;
    this.limit = this.MIN_REQUEST_LIMIT;
    this.timer;
    this.jsonResend = jsonResend;
  }
  setDefaultConfig() {
    this.limit = this.MIN_REQUEST_LIMIT;
    this.currentInterval = this.MIN_TIMEOUT;
  }
  setApiErrorConfig() {
    this.limit -= this.REQUEST_LIMIT_STEP;
    if (this.limit < this.MIN_REQUEST_LIMIT) {
      this.limit = this.MIN_REQUEST_LIMIT;
    }
    this.currentInterval += this.TIMEOUT_STEP;
    if (this.currentInterval > this.MAX_TIMEOUT) {
      this.currentInterval = this.MAX_TIMEOUT;
    }
  }
  setApiOkConfig() {
    this.limit += this.REQUEST_LIMIT_STEP;
    if (this.limit > this.MAX_REQUEST_LIMIT) {
      this.limit = this.MAX_REQUEST_LIMIT;
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
            file: apiError.fileMeta.file.name + apiError.fileMeta.file.ext,
          };
          appLogger.printLog(logTypes.API_ERROR, logData);
          this.setApiErrorConfig();
        }
        if (result.hasOwnProperty('sentList')) {
          this.setApiOkConfig();
        }
        appLogger.printLog(logTypes.INFO_RESENDER, {
          count: result.count,
          interval: this.currentInterval,
          limit: this.limit,
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
