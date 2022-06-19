const { printLog } = require('../logger/appLogger');
const { AppError } = require('../errorHandlers');
const { MAX_REQUESTS_COUNT } = require('../../common/config');
const alertScheduler = require('./alertScheduler');
const botIcons = require('../telegBot/botIcons');
const jsonResend = require('./resender');
/**
 * @Class RejectWatcher
 * @description Class for management jsonResend work. It sets timeout for check cash db and  amount of requests to the api
 */
class RejectWatcher {
    constructor() {
        this.MAX_TIMEOUT = 30000;
        this.MIN_TIMEOUT = 5000;
        this.TIMEOUT_STEP = 5000;
        this.MAX_REQUEST_LIMIT = MAX_REQUESTS_COUNT;
        this.MIN_REQUEST_LIMIT = 1;
        this.REQUEST_LIMIT_STEP = 3;
        this.REQUEST_LIMIT_DEFAULT = 3; 
        this.countAttempt = 0;
        this.timer = null;
        this.jsonResend = jsonResend;
        this.alertsHistory = {
            deliveredAlerts: [],
            lastCount: 0,
            isBigQueue: false,
        };
        this.alertScheduler = alertScheduler;
        this.setDefaultConfig();
    }

    /**
     * @method isShouldSendToBot
     * @description For to calculate if it is necessary send message to the bot
     * @param {number} countQuery
     * @returns {object} result
     * @returns {boolean} result.shouldSent
     * @returns {boolean} result.isGrown
     */
    isShouldSendToBot(countQuery) {
        const { isGrown, shouldSent, deliveredAlerts, isBigQueue } =
            alertScheduler(countQuery, this.alertsHistory);
        this.alertsHistory = {
            deliveredAlerts,
            isBigQueue,
            lastCount: countQuery,
        };
        return { shouldSent, isGrown };
    }
    /**
     * @method setDefaultConfig
     * @description Set default config for watching on the start and if query = 0
     * @returns {void}
     */

    setDefaultConfig() {
        this.limit = this.REQUEST_LIMIT_DEFAULT;
        this.currentInterval = this.MIN_TIMEOUT;
        this.countAttempt = 0;
    }

    /**
     * @method setApiErrorConfig
     * @description Set this config when api received less 50% of requests
     * @returns {void}
     */
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

    /**
     * @method setApiOkConfig
     * @description Set this config when api received more 50% of requests
     * @returns {void}
     */
    setApiOkConfig() {
        this.limit += this.REQUEST_LIMIT_STEP;
        if (this.limit > this.MAX_REQUEST_LIMIT) {
            this.limit = this.MAX_REQUEST_LIMIT;
        }
        this.currentInterval = this.MIN_TIMEOUT;
    }

    /**
     * @method startWatch
     * @description This method launch work jsonResend and after timeout restarts it again
     * @returns {void}
     */

    startWatch() {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
            this.countAttempt +=1;
            this.jsonResend(this.limit, this.countAttempt)
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

                    if (count !== 0) {
                        const logMessage = `[RESENDER-${this.countAttempt} END]${
                        countOfSent ? ` COUNT_OF_SENT: ${countOfSent} ` : ' '
                    }SET_REQUEST_LIMIT: ${
                            this.limit
                        } SET_WAIT_TIMEOUT: ${this.currentInterval}`;

                        printLog(logMessage).warning();
                    }

                    if (count && this.alertsHistory.lastCount !== count) {
                        const { isGrown, shouldSent } =
                            this.isShouldSendToBot(count);
                        if (shouldSent) {
                            if (count > 0) {
                                const botIcon = isGrown
                                    ? botIcons.QUERY_UP
                                    : botIcons.QUERY_DOWN;

                                const botMessage = `[RESENDER_A-${this.countAttempt}] WAITING_REQUESTS_COUNT: ${count} REQUEST_LIMIT: ${
                                    this.limit
                                } ${
                                    countOfSent ? `COUNT_OF_SENT: ${countOfSent}` : ''
                                } WAIT_TIMEOUT: ${this.currentInterval}`;

                                printLog(botMessage).botMessage(` ${botIcon}`);
                            } else {
                                printLog('API_OK').botMessage(botIcons.API_OK);
                            }
                        }
                    }

                    this.startWatch();
                    
                })
                .catch((error) => {
                    printLog(
                        new AppError(error, 'WATCHER_RESENDER_A')
                    ).error();
                    this.startWatch();
                });
        }, this.currentInterval);
    }

    /**
     * @method startWatch
     * @description This method for stop jsonResend work
     * @returns {void}
     */
    stopWatch() {
        clearTimeout(this.timer);
    }
}

module.exports = RejectWatcher;
