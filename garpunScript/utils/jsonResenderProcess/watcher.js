const { printLog, logTypes } = require('../logger/appLogger');
class RejectWatcher {
  constructor(jsonResend) {
    this.MAX_TIMEOUT = 5000;
    this.MIN_TIMEOUT = 2000;
    this.TIMEOUT_STEP = 5000;
    this.MAX_REQUEST_LIMIT = process.env.MAX_REQUESTS_COUNT || 50;
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
      this.jsonResend(this.limit)
        .then((result) => {
          const { count, sentList } = result;
          let countOfSent;
          if (count && count === 0) {
            this.setDefaultConfig();
          }
          if (sentList && sentList.length) {
            const calcResult = sentList.reduce(
              (acc, item) => {
                if (item.status === 'rejected') {
                  acc.rejected += 1;
                }
                if (item.status === 'fulfilled') {
                  acc.fulfilled += 1;
                }
                return acc;
              },
              { rejected: 0, fulfilled: 0 }
            );
            countOfSent = `${calcResult.fulfilled}/${sentList.length}`;
            const percentageOfDelivered =
              (100 * calcResult.fulfilled) / sentList.length;
            if (percentageOfDelivered < 50) {
              this.setApiErrorConfig();
            } else {
              this.setApiOkConfig();
            }
          }

          printLog(logTypes.INFO_RESENDER, {
            count: result.count,
            interval: this.currentInterval,
            limit: this.limit,
            countOfSent,
          });
        })
        .catch((error) => {
          console.error(error);
        })
        .finally(this.startWatch());
    }, this.currentInterval);
  }
  stopWatch() {
    clearTimeout(this.timer);
  }
}

module.exports = RejectWatcher;
