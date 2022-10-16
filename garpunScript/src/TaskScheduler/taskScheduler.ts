import moment from 'moment';
/* eslint-disable class-methods-use-this */
const schedule = require('node-schedule');

const config = require('../common/config');
const { StatReportModel } = require('../models/statReport');
const GetEventsStat = require('../statCollector/eventStat');
const { appLogger } = require('../logger/appLogger');
const SenderStatReport = require('./senderStatReport');

/**
 * Task scheduler for start cron jobs
 */
export class TaskScheduler {
    start() {
        /**
         * Task for collect and save in db cameras stat for a day. Task runs on the 3 o'clock
         *
         */
        schedule.scheduleJob(config.TASK_SCHEDULER_GET_STAT, () => {
            const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
            appLogger.setLogMessage(
                `Start task for collect cameras stat for ${yesterday}`
            ).appInfoMessage();
            new GetEventsStat(yesterday)
                .getStat()
                .then((report:any) => {
                    const jsonReport = JSON.stringify(report);
                    return StatReportModel.create({ reportData: jsonReport });
                })
                .then(() => {
                    appLogger.setLogMessage(
                        `Cameras stats for ${yesterday} successful created.`
                    ).appInfoMessage();
                })
                .catch((error:any) => {
                    console.error('TASK_SCHEDULE', error);
                });
        });
        /**
         * Task for send cameras stat to telegram. Task runs at the 9 o'clock
         */
        schedule.scheduleJob(config.TASK_SCHEDULER_SEND_STAT, () => {
            const timeToday = moment().format('YYYY-MM-DD');
            appLogger.setLogMessage(
                `Start task for send cameras stat by ${timeToday} to telegram`
            ).appInfoMessage();
            const telegSender = new SenderStatReport(timeToday);
            telegSender
                .send()
                .then(() => {
                    appLogger.setLogMessage(
                        `Cameras stat by ${timeToday} successful sent to telegram`
                    ).appInfoMessage();
                })
                .catch((error:any) => {
                    console.error('TASK_SCHEDULE', error);
                });
        });
    }
}

