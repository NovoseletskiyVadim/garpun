import { watcher } from  './watcher';
import { appLogger } from '../logger/appLogger';
/**
 * @description The process for controlling the camerasWatcher.
 * Listen to events:
 * START, STOP - camerasWatcher
 * EVENT - when received event from camera
 * GET_STATS - for collect stat about last cameras events
 */
process.on('message', (event:any) => {
    const { type, data } = event;
    const watcherInstance = watcher();
    switch (type) {
        case 'START':
            appLogger.setLogMessage(
                `CamerasWatcher started ID:${process.pid}`
            ).appInfoMessage();
            watcherInstance.startWatch().then(() => {
                (<any> process).send({ status: true });
            });
            break;
        case 'EVENT':
            watcherInstance.cameraAction(data);
            break;
        case 'GET_STATS':
            (<any> process).send({ cameraStats: watcherInstance.getLastCamerasEvents() });
            break;
        default:
            break;
    }
});
