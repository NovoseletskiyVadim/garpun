/* eslint-disable no-case-declarations */
import { EOL }  from 'os';
import { AbstractLogEvent } from './AbstractLogEvent';
import { alarmSignal } from '../telegBot/harpoonBot';
import appErrorLog from './logToFile';
import { AbstractError } from '../errorHandlers/AbstractError';

export const appLogger = {
    setLogMessage(event: any) {
        let message = '';
        if (event instanceof AbstractLogEvent || event instanceof AbstractError) {
            message = event.prepareMsgToPrint();
        } else {
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

            botMessage(iconType:string = '') {
                alarmSignal(`${message} ${iconType}`);
            },
        };
    },
};
