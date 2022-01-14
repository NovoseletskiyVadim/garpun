/* eslint-disable no-case-declarations */
const { EOL } = require('os');

const { alarmSignal } = require('../telegBot/harpoonBot');
const AbstractErrorLogEvent = require('../errorHandlers/AbstractErrorLogEvent');
const { appErrorLog } = require('./logToFile');

module.exports = {
    printLog(event) {
        let message = '';
        if (event instanceof AbstractErrorLogEvent) {
            message = event.PrepareMsgToPrint();
        }
        else {
            message = event;
        }
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
            /**
             * Show error in console log
             * @returns 
             */
            error() {
                process.stderr.write(`\x1b[31m${message}\x1b[0m${EOL}`);
                return this;
            },
            /**
             * Save error to error log file
             * @returns 
             */
            toErrorLog() {
                appErrorLog({ message });
                return this;
            },

            botMessage(iconType) {
                const icon = iconType || '';
                alarmSignal(`${message} ${icon}`);
            },
        };
    },
};
