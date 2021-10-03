const watcher = require('./watcher')();
const { printLog } = require('../logger/appLogger');
/**
 * @description The process for controlling the camerasWatcher.
 * Listen to events:
 * START, STOP - camerasWatcher
 * EVENT - when received event from camera
 * GET_STATS - for collect stat about last cameras events
 */
process.on('message', (event) => {
    const { type, data } = event;
    switch (type) {
        case 'START':
            printLog(
                `CamerasWatcher started ID:${process.pid}`
            ).appInfoMessage();
            watcher.startWatch().then(() => {
                process.send({ status: true });
            });
            break;
        case 'EVENT':
            watcher.cameraAction(data);
            break;
        case 'GET_STATS':
            process.send({ cameraStats: watcher.getLastCamerasEvents() });
            break;
        default:
            break;
    }
});
