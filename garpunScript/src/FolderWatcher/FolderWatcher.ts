/* eslint-disable import/no-import-module-exports */
import chokidar from 'chokidar';

import { StartChainHandlers } from '../EventHandlers/StartChainHandlers';
import { appLogger } from  '../logger/appLogger';
import { AppError } from '../errorHandlers';


type WatchParams = {
    dirName:string,
    watchPath: string,
}


export class FolderWatchersManager {
    private static instance: FolderWatchersManager;

    private watchersStore = new Map();

    private readonly ignoredFiles = ['.*DVRWorkDirectory.*'];

    private readonly MODULE_NAME = 'FOLDER_WATCHER';

    public static getManager(): FolderWatchersManager {
        if (!FolderWatchersManager.instance) {
            FolderWatchersManager.instance = new FolderWatchersManager();
        }

        return FolderWatchersManager.instance;
    }

    addFolderToWatch (params: WatchParams) {
        const { dirName, watchPath } = params;

        const watcher = chokidar.watch(watchPath, {
            ignored: new RegExp(this.ignoredFiles.join('|'), 'gi'),
            persistent: true,
            awaitWriteFinish: true,
        });

        watcher
            .on('add', (pathFile) => new StartChainHandlers(pathFile, this.MODULE_NAME).execute())
            .on('error', (error) => {
                appLogger.setLogMessage(
                    new AppError(error, 'FILE_WATCHER_ERROR')
                ).error();
            });

        this.watchersStore.set(dirName, watcher);

        appLogger
            .setLogMessage(`Under watch: ${watchPath}`)
            .appInfoMessage();
    }

    async stopWatch(folderName:string): Promise<void> {

        const watcher = this.watchersStore.get(folderName);
        await watcher.close();
        this.watchersStore.delete(folderName);

        appLogger.setLogMessage(`Stop watch: ${folderName}`).appInfoMessage();
    }

}
