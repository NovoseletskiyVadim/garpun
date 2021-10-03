/* eslint-disable class-methods-use-this */
const schedule = require('node-schedule');
const moment = require('moment');

const ReportsQuery = require('../../models/reports');
const GetEventsStat = require('../statCollector/eventStat');
const { printLog } = require('../logger/appLogger');
const SenderStatReport = require('./senderStatReport');

/**
 * Task scheduler for start cron jobs
 */
class TaskScheduler {
    start() {
        /**
         * Task for collect and save in db cameras stat for a day. Task runs on the 3 o'clock
         *
         */
        schedule.scheduleJob('* 3 * * *', () => {
            const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
            printLog(
                `Start task for collect cameras stat for ${yesterday}`
            ).appInfoMessage();
            new GetEventsStat(yesterday)
                .getStat()
                .then((report) => {
                    const jsonReport = JSON.stringify(report);
                    return ReportsQuery.create({ reportData: jsonReport });
                })
                .then(() => {
                    printLog(
                        `Cameras stats for ${yesterday} successful created.`
                    ).appInfoMessage();
                })
                .catch((error) => {
                    console.error('TASK_SCHEDULE', error);
                });
        });
        /**
         * Task for send cameras stat to telegram. Task runs at the 9 o'clock
         */
        schedule.scheduleJob('* 9 * * *', () => {
            const timeToday = moment().format('YYYY-MM-DD');
            printLog(
                `Start task for send cameras stat by ${timeToday} to telegram`
            ).appInfoMessage();
            const telegSender = new SenderStatReport(timeToday);
            telegSender
                .send()
                .then(() => {
                    printLog(
                        `Cameras stat by ${timeToday} successful sent to telegram`
                    ).appInfoMessage();
                })
                .catch((error) => {
                    console.error('TASK_SCHEDULE', error);
                });
        });
    }
}

module.exports = TaskScheduler;
