const chokidar = require('chokidar');

const fileHandler = require('./fileHandler');
const { printLog, logTypes } = require('../logger/appLogger');
const { AppError } = require('../errorHandlers');

module.exports = () => {
    const ignoredFiles = ['.*DVRWorkDirectory.*'];
    const dirWatchersList = new Map();
    return {
        addDirToWatch: (options) => {
            const { dirName, watchPath } = options;
            const watcher = chokidar.watch(watchPath, {
                ignored: new RegExp(ignoredFiles.join('|'), 'gi'),
                persistent: true,
                awaitWriteFinish: true,
            });
            dirWatchersList.set(dirName, watcher);
            printLog(logTypes.APP_INFO, `Under watch: ${watchPath}`);
            watcher
                .on('add', (pathFile) => fileHandler(pathFile))
                .on('error', (error) => {
                    printLog(
                        logTypes.APP_ERROR,
                        new AppError(error, 'FILE_WATCHER_ERROR')
                    );
                });
        },
        stopWatchDir: (dirName) => {
            const watcher = dirWatchersList.get(dirName);
            watcher.close().then(() => {
                dirWatchersList.delete(dirName);
                printLog(logTypes.APP_INFO, `Stop watch: ${dirName}`);
            });
        },
    };
};
