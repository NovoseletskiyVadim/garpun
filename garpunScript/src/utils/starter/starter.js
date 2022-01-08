/* eslint-disable no-param-reassign */
const fsp = require('fs').promises;
const path = require('path');

const Cameras = require('../../models/cameras');
const dirWatcher = require('../ftpWatcher/dirWatcher')();
const fileHandler = require('../ftpWatcher/fileHandler.js');
const { MAX_REQUESTS_COUNT, MEDIA_PATH } = require('../../common/config');
const { printLog } = require('../logger/appLogger');
const { AppError } = require('../errorHandlers');

const dirHandler = (dirInfo, stateUpdate) => {
    const { filesList, maxRequests, dirPath, dirName } = dirInfo;
    const filesInDir = filesList.length;
    if (filesInDir > 0) {
        const listToSend = [];
        const amtToSend = filesInDir > maxRequests ? maxRequests : filesInDir;
        for (let index = 0; index < amtToSend; index += 1) {
            listToSend.push(
                fileHandler(path.join(dirPath, filesList[index]), 'APP_STARTER')
            );
        }
        return Promise.all(listToSend).then(() => {
            dirInfo.filesList.splice(0, amtToSend);
            return dirHandler(dirInfo, stateUpdate);
        });
    }
    stateUpdate();
    dirWatcher.addDirToWatch({
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
                (MAX_REQUESTS_COUNT * percentFullness) / 100
            );
            allowedRequests = maxRequests === 0 ? 1 : maxRequests;
        }
        if (item.maxRequests !== allowedRequests) {
            printLog(
                `cameraName: ${item.dirName} filesInFolder: ${item.filesList.length} allowedRequests: ${allowedRequests}`
            ).appInfoMessage();
        }
        item.maxRequests = allowedRequests;

        return item;
    });
};

const harpoonStarter = () =>
    Cameras.findAll({
        raw: true,
        where: {
            isOnLine: true,
        },
    })
        .then((camerasList) => {
            if (!camerasList.length) {
                return Promise.reject(new Error('No cameras in dataBase'));
            }
            return fsp.readdir(MEDIA_PATH).then((camerasDirsPathsList) => {
                const camerasDirsToWatch = camerasDirsPathsList.filter(
                    (dirName) => {
                        const result = camerasList.find((cameraInfo) => {
                            if (cameraInfo.ftpHomeDir === dirName) {
                                return true;
                            }
                            return false;
                        });
                        if (result) {
                            return true;
                        }
                        return false;
                    }
                );
                const ftpDirsStatListReq = camerasDirsToWatch.map((dirName) => {
                    const cameraDirPath = path.join(MEDIA_PATH, dirName);
                    return fsp.readdir(cameraDirPath).then((filesList) => ({
                        dirName,
                        dirPath: cameraDirPath,
                        filesList,
                    }));
                });
                return Promise.all(ftpDirsStatListReq).then(
                    (ftpDirsStatList) => {
                        const calcMaxReqForDir =
                            maxRequestsCalculator(ftpDirsStatList);
                        calcMaxReqForDir();
                        const listDirsInProcess = ftpDirsStatList.map((dir) =>
                            dirHandler(dir, calcMaxReqForDir)
                        );
                        return Promise.all(listDirsInProcess).then(
                            (resultList) => {
                                printLog(
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
            printLog(new AppError(error, 'STARTER_ERROR'))
                .error()
                .toErrorLog()
                .errorGroupChatMessage();
            process.exitCode = 1;
        });

module.exports = harpoonStarter;
