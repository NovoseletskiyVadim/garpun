import { appLogger } from '../logger/appLogger';
/**
 * @description The process for controlling the JsonResender. Listen to events  START and STOP JsonResender
 */
const RejectWatcher = require('./watcher');

const watcher = new RejectWatcher();

process.on('message', (event) => {
    const { type } = event;
    switch (type) {
        case 'START':
            appLogger.setLogMessage(
                `JsonResender started with ID:${process.pid}`
            ).appInfoMessage();
            watcher.startWatch();
            break;
        case 'STOP':
            watcher.stopWatch();
            break;
        default:
            break;
    }
});
