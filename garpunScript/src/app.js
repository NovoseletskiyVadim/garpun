// require('dotenv').config();
const config = require('./common/config');
const dbConnect = require('./db/dbConnect');
const { printLog } = require('./utils/logger/appLogger');
const { appStartAlert } = require('./utils/telegBot/harpoonBot');
const harpoonStarter = require('./utils/starter/starter');
const { camerasWatcher, rejectApiHandler } = require('./utils/childProcesses');
const TaskScheduler = require('./utils/TaskScheduler/taskScheduler');
const { AppError } = require('./utils/errorHandlers');

printLog(`APP_STARTED_MODE: ${process.env.NODE_ENV}`).appInfoMessage();
printLog(`APP_ID: ${process.pid}`).appInfoMessage();

if (parseInt(config.ARCHIVE_DAYS, 10) > 0) {
    printLog(`FILE_ARCHIVE: ${config.ARCHIVE_DAYS}`).appInfoMessage();
} else {
    printLog('FILE_ARCHIVE: OFF').appInfoMessage();
}

process.on('uncaughtException', async (error) => {
    printLog(new AppError(error, 'UNCAUGHTEXCEPTION').toPrint())
        .error()
        .toErrorLog();
});

process.on('unhandledRejection', async (error) => {
    printLog(new AppError(error, 'UNHANDLEDREJECTION').toPrint())
        .error()
        .toErrorLog();
});

const app = dbConnect
    .connectionTest()
    // uncomment this for first start
    //   .then(() =>
    //     dbConnect.dbTablesCreate().then(() => {
    //   printLog('tables created').appInfoMessage();
    //       return true;
    //     })
    //   )
    .then(() => {
        // rejectApiHandler.send({ type: 'START' });

        camerasWatcher.send({ type: 'START' });

        camerasWatcher.on('message', (data) => {
            const { status } = data;
            if (status) {
                new TaskScheduler().start();
                rejectApiHandler.send({ type: 'START' });
                harpoonStarter();
                appStartAlert();
            }
        });
    })
    .catch((error) => {
        printLog(new AppError(error, 'APP_START_ERROR').error().toErrorLog());
    });

const stopAPP = () => {
    rejectApiHandler.kill();
    camerasWatcher.kill();
};

module.exports = { stopAPP, app };
