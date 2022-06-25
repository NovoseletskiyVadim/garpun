const chokidar = require('chokidar');

// const fileHandler = require('./fileHandler');
const { printLog } = require('../logger/appLogger');
const { AppError } = require('../errorHandlers');

const StartFileHandler = require('../fileExplorer/StartHandler');

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
            printLog(`Under watch: ${watchPath}`).appInfoMessage();
            watcher
                // .on('add', (pathFile) => fileHandler(pathFile))
                .on('add', (pathFile) => new StartFileHandler(pathFile).execute())
                .on('error', (error) => {
                    printLog(new AppError(error, 'FILE_WATCHER_ERROR'))
                        .error()
                        .toErrorLog()
                        .errorGroupChatMessage();
                });
        },
        stopWatchDir: (dirName) => {
            const watcher = dirWatchersList.get(dirName);
            watcher.close().then(() => {
                dirWatchersList.delete(dirName);
                printLog(`Stop watch: ${dirName}`).appInfoMessage();
            });
        },
    };
};
