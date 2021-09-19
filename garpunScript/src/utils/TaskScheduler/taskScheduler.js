/* eslint-disable class-methods-use-this */
const schedule = require('node-schedule');
const moment = require('moment');

const ReportsQuery = require('../../models/reports');
const GetEventsStat = require('../statCollector/eventStat');
const { printLog, logTypes } = require('../logger/appLogger');
const SenderStatReport = require('./senderStatReport');
const { AppError } = require('../errorHandlers');
/**
 * Task scheduler for start cron jobs
 */
class TaskScheduler {
    start() {
        /**
         * Task for collect and save in db cameras stat for a day. Task runs on the 3 o'clock
         *
         */
        schedule.scheduleJob('31 23 * * *', () => {
            const yesterday = moment()
                .subtract(35, 'days')
                .format('YYYY-MM-DD');
            printLog(
                logTypes.APP_INFO,
                `Start task for collect cameras stat for ${yesterday}`
            );
            new GetEventsStat(yesterday)
                .getStat()
                .then((report) => {
                    const jsonReport = JSON.stringify(report);
                    return ReportsQuery.create({ reportData: jsonReport });
                })
                .then(() => {
                    printLog(
                        logTypes.APP_INFO,
                        `Cameras stats for ${yesterday} successful created.`
                    );
                })
                .catch((error) => {
                    printLog(
                        logTypes.APP_ERROR,
                        new AppError(error, 'TASK_SCHEDULE')
                    );
                });
        });
        /**
         * Task for send cameras stat to telegram. Task runs at the 9 o'clock
         */
        schedule.scheduleJob('33 23 * * *', () => {
            const timeToday = moment().format('YYYY-MM-DD');
            printLog(
                logTypes.APP_INFO,
                `Start task for send cameras stat by ${timeToday} to telegram`
            );
            const telegSender = new SenderStatReport(timeToday);
            telegSender
                .send()
                .then(() => {
                    printLog(
                        logTypes.APP_INFO,
                        `Cameras stat by ${timeToday} successful sent to telegram`
                    );
                })
                .catch((error) => {
                    printLog(
                        logTypes.APP_ERROR,
                        new AppError(error, 'TASK_SCHEDULE')
                    );
                });
        });
    }
}

module.exports = TaskScheduler;
