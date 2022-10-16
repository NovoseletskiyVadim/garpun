import appConfig from './common/config';
import { connectionTest } from './db/dbConnect';
import { dbTablesCreate } from './db/tablesCreate';
import { AppError } from './errorHandlers/appError';
import { appLogger }  from './logger/appLogger';
import { appStartBotAlert } from './telegBot/harpoonBot';
import { TaskScheduler } from './TaskScheduler/taskScheduler';
import { harpoonStarter } from './coldStarter/coldStarter';
import { CamerasWatcherProcessManager } from './camerasWatcherProcess/ProcessManager';
import { RequestRetryProcessManager } from './requestRetryProcess/ProcessManager';

appLogger.setLogMessage(`APP_STARTED_MODE: ${process.env.NODE_ENV}`).appInfoMessage();
appLogger.setLogMessage(`APP_ID: ${process.pid}`).appInfoMessage();

if (appConfig.ARCHIVE_DAYS > 0) {
    appLogger.setLogMessage(`FILE_ARCHIVE: ${appConfig.ARCHIVE_DAYS}`).appInfoMessage();
} else {
    appLogger.setLogMessage('FILE_ARCHIVE: OFF').appInfoMessage();
}
if (appConfig.TRASH_ARCHIVE_DAYS > 0) {
    appLogger.setLogMessage(`TRASH_ARCHIVE: ${appConfig.TRASH_ARCHIVE_DAYS}`).appInfoMessage();
} else {
    appLogger.setLogMessage('TRASH_ARCHIVE: OFF').appInfoMessage();
}

process.on('uncaughtException', async (error) => {
    appLogger.setLogMessage(new AppError(error, 'UNCAUGHTEXCEPTION'))
        .error()
        .toErrorLog();
});

process.on('unhandledRejection', async (error) => {
    appLogger.setLogMessage(new AppError(error, 'UNHANDLEDREJECTION'))
        .error()
        .toErrorLog();
});

((async() => {
    try {
        await connectionTest();
        await dbTablesCreate();

        const camerasStatusWatcher = CamerasWatcherProcessManager.getInstance();

        camerasStatusWatcher.start();

        if (await camerasStatusWatcher.isSuccessfullyStarted()) {
            new TaskScheduler().start();
            RequestRetryProcessManager.getInstance().start();
            harpoonStarter();
            appStartBotAlert();
        }

    } catch (error) {
        console.error(error);

    }

}))();
