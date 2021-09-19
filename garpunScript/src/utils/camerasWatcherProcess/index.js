const watcher = require('./watcher')();
const { printLog } = require('../logger/appLogger');

process.on('message', (event) => {
    const { type, data } = event;
    switch (type) {
        case 'START':
            printLog(
                `CamerasWatcher started ID:${process.pid}`
            ).appInfoMessage();
            //   process.send({ status: true });
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
