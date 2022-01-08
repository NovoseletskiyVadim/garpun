const { AppError } = require('./utils/errorHandlers');
const { camerasWatcher, rejectApiHandler } = require('./utils/childProcesses');
const config = require('./common/config');
const dbConnect = require('./db/dbConnect');
const harpoonStarter = require('./utils/starter/starter');
const { HarpoonBotMsgSender } = require('./utils/telegBot/harpoonBot');
const { printLog } = require('./utils/logger/appLogger');
const RecipientGroupsStore = require('./utils/telegBot/RecipientGroupsStore');
const TaskScheduler = require('./utils/TaskScheduler/taskScheduler');

printLog(`APP_STARTED_MODE: ${process.env.NODE_ENV}`).appInfoMessage();
printLog(`APP_ID: ${process.pid}`).appInfoMessage();

if (parseInt(config.ARCHIVE_DAYS, 10) > 0) {
    printLog(`FILE_ARCHIVE: ${config.ARCHIVE_DAYS}`).appInfoMessage();
} else {
    printLog('FILE_ARCHIVE: OFF').appInfoMessage();
}
if (parseInt(config.TRASH_ARCHIVE_DAYS, 10) > 0) {
    printLog(`TRASH_ARCHIVE: ${config.TRASH_ARCHIVE_DAYS}`).appInfoMessage();
} else {
    printLog('TRASH_ARCHIVE: OFF').appInfoMessage();
}

process.on('uncaughtException', async (error) => {
    printLog(new AppError(error, 'UNCAUGHTEXCEPTION'))
        .error()
        .toErrorLog()
        .errorGroupChatMessage();
});

process.on('unhandledRejection', async (error) => {
    printLog(new AppError(error, 'UNHANDLEDREJECTION'))
        .error()
        .toErrorLog()
        .errorGroupChatMessage();
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
        harpoonStarter();
        // rejectApiHandler.send({ type: 'START' });

        // camerasWatcher.send({ type: 'START' });

        // camerasWatcher.on('message', (data: any) => {
        //     const { status } = data;
        //     if (status) {
        //         const isDevMode = process.env.NODE_ENV === 'DEV' ? 'DEV' : '';
        //         const msg = `Harpoon ${isDevMode} launched ${HarpoonBotMsgSender.telegramIcons.APP_START}`;
        //         printLog(msg).botMessage(RecipientGroupsStore.groupTypes.ALL);
        //         new TaskScheduler().start();
        //         rejectApiHandler.send({ type: 'START' });
        //         harpoonStarter();
        //     }
        // });
    })
    .catch((error: any) => {
        printLog(new AppError(error, 'APP_START_ERROR'))
            .error()
            .toErrorLog()
            .errorGroupChatMessage();
    });

const stopAPP = () => {
    rejectApiHandler.kill();
    camerasWatcher.kill();
};

module.exports = { stopAPP, app };
