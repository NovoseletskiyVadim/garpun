/* eslint-disable no-param-reassign */
import path from 'path';
import  { promises as fsp } from 'fs';
// import * as  fsp from 'fs/promises';
// eslint-disable-next-line import/no-import-module-exports
import { StartChainHandlers } from '../EventHandlers/StartChainHandlers';
import { appLogger } from '../logger/appLogger';
import appConfig from '../common/config';
import { CameraModel } from '../models/camera';
import { FolderWatchersManager } from '../FolderWatcher/FolderWatcher';
import { AppError } from  '../errorHandlers';

const folderWatchersManager = FolderWatchersManager.getManager();
const MODULE_NAME = 'STARTER';

const dirHandler = (dirInfo, stateUpdateFn) => {
    const {
        filesList, maxRequests, dirPath, dirName
    } = dirInfo;
    const filesInDir = filesList.length;
    if (filesInDir > 0) {
        const listToSend: Array<Promise<void>> = [];
        const amtToSend = filesInDir > maxRequests ? maxRequests : filesInDir;
        for (let index = 0; index < amtToSend; index += 1) {
            listToSend.push(
                new StartChainHandlers(path.join(dirPath, filesList[index]), MODULE_NAME).execute()
            );
        }
        return Promise.all(listToSend).then(() => {
            dirInfo.filesList.splice(0, amtToSend);
            return dirHandler(dirInfo, stateUpdateFn);
        });
    }

    stateUpdateFn();

    folderWatchersManager.addFolderToWatch({
        dirName,
        watchPath: dirPath,
    });
    return Promise.resolve(dirName);
};

const maxRequestsCalculator = (dirList) => () => {
    let calcTotalFiles = 0;
    dirList.forEach((item) => {
        if (Array.isArray(item.filesList) && item.filesList.length > 0) {
            calcTotalFiles += item.filesList.length;
        }
    });

    dirList.forEach((item) => {
        const calcDirFiles = item.filesList.length;
        let allowedRequests = 0;
        if (calcDirFiles > 0) {
            const percentFullness = Math.floor(
                (calcDirFiles / calcTotalFiles) * 100
            );
            const maxRequests = Math.round(
                (appConfig.MAX_REQUESTS_COUNT * percentFullness) / 100
            );
            allowedRequests = maxRequests === 0 ? 1 : maxRequests;
        }
        if (item.maxRequests !== allowedRequests) {
            appLogger.setLogMessage(
                `cameraName: ${item.dirName} filesInFolder: ${item.filesList.length} allowedRequests: ${allowedRequests}`
            ).appInfoMessage();
        }
        item.maxRequests = allowedRequests;

        return item;
    });
};

export const harpoonStarter = () =>
    CameraModel.findAll({
        raw: true,
        where: {
            isOnLine: true,
        },
    })
        .then((camerasList) => {
            if (!camerasList.length) {
                return Promise.reject(new Error('No cameras in dataBase'));
            }
            if (!appConfig.MEDIA_PATH) {
                return Promise.reject(new Error('No set MEDIA_PATH'));
            }
            return fsp.readdir(appConfig.MEDIA_PATH)
                .then((foldersList) => {
                    const ftpHomeDirList = camerasList.map(cameraInfo => cameraInfo.ftpHomeDir);
                    const foldersToWatch = foldersList.filter((dirName) => ftpHomeDirList.includes(dirName));

                const getFoldersStatReqList = foldersToWatch.map((dirName) => {
                    const cameraFolderPath = path.join(appConfig.MEDIA_PATH, dirName);
                    return fsp.readdir(cameraFolderPath).then((filesList) => ({
                        dirName,
                        dirPath: cameraFolderPath,
                        filesList,
                    }));
                });
                return Promise.all(getFoldersStatReqList).then(
                    (foldersStatList) => {
                        const calcMaxReqForDir = maxRequestsCalculator(foldersStatList);
                        calcMaxReqForDir();
                        const listDirsInProcess = foldersStatList.map((dir) =>
                            dirHandler(dir, calcMaxReqForDir));
                        return Promise.all(listDirsInProcess).then(
                            (resultList) => {
                                appLogger.setLogMessage(
                                    `All folder is under watch:\n ${resultList.join(
                                        '\n '
                                    )}`
                                ).successful();
                            }
                        );
                    }
                );
            });
        })
        .catch((error) => {
            appLogger.setLogMessage(new AppError(error, 'STARTER_ERROR')).error();
            process.exitCode = 1;
        });
