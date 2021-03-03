const fsp = require('fs').promises;
const path = require('path');

const Cameras = require('../../models/cameras');
const dirWatcher = require('../ftpWatcher/dirWatcher')();
const fileHandler = require('../../utils/ftpWatcher/fileHandler');

const MAX_REQUESTS_COUNT = process.env.MAX_REQUESTS_COUNT || 50;

const { printLog, logTypes } = require('./../logger/appLogger');

const dirHandler = (dirInfo, stateUpdate) => {
  const { filesList, maxRequests, dirPath, dirName } = dirInfo;
  const filesInDir = filesList.length;
  if (filesInDir > 0) {
    const listToSend = [];
    const amtToSend = filesInDir > maxRequests ? maxRequests : filesInDir;
    for (let index = 0; index < amtToSend; index++) {
      listToSend.push(fileHandler(path.join(dirPath, filesList[index])));
    }
    return Promise.all(listToSend).then(() => {
      dirInfo.filesList.splice(0, amtToSend);
      return dirHandler(dirInfo, stateUpdate);
    });
  } else {
    stateUpdate();
    dirWatcher.addDirToWatch({
      dirName,
      watchPath: dirPath,
    });
    return Promise.resolve(dirName);
  }
};

const maxRequestsCalc = (dirList) => {
  return () => {
    let calcTotalFiles = 0;
    dirList.forEach((item) => {
      if (Array.isArray(item.filesList) && item.filesList.length > 0) {
        calcTotalFiles += item.filesList.length;
      }
    });

    dirList.forEach((item) => {
      const calcDirFiles = item.filesList.length;
      allowedRequests = 0;
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
        console.log(
          `cameraName: ${item.dirName} filesInFolder: ${item.filesList.length} allowedRequests: ${allowedRequests}`
        );
      }
      item.maxRequests = allowedRequests;

      return item;
    });
  };
};

const harpoonStarter = () => {
  return Cameras.findAll({
    raw: true,
    where: {
      isOnLine: true,
    },
  })
    .then((camerasList) => {
      if (!camerasList.length) {
        return Promise.reject(new Error('No cameras in dataBase'));
      }
      if (!process.env.MEDIA_PATH) {
        return Promise.reject(new Error('Set MEDIA_PATH in env file'));
      }
      return fsp
        .readdir(process.env.MEDIA_PATH)
        .then((camerasDirsPathsList) => {
          const camerasDirsToWatch = camerasDirsPathsList.filter((dirName) => {
            const result = camerasList.find((cameraInfo) => {
              if (cameraInfo.ftpHomeDir === dirName) {
                return true;
              }
            });
            if (result) {
              return true;
            }
          });
          const ftpDirsStatList = camerasDirsToWatch.map((dirName) => {
            const cameraDirPath = path.join(process.env.MEDIA_PATH, dirName);
            return fsp.readdir(cameraDirPath).then((filesList) => {
              return { dirName, dirPath: cameraDirPath, filesList };
            });
          });
          return Promise.all(ftpDirsStatList).then((ftpDirsStatList) => {
            const calcMaxReqForDir = maxRequestsCalc(ftpDirsStatList);
            calcMaxReqForDir();
            const listDirsInProcess = ftpDirsStatList.map((dir) => {
              return dirHandler(dir, calcMaxReqForDir);
            });
            Promise.all(listDirsInProcess).then((resultList) => {
              console.log('All folder under watch: ' + resultList.join(', '));
            });
          });
        });
    })
    .catch((error) => {
      printLog(logTypes.APP_ERROR, {
        errorType: 'STARTER_ERROR',
        errorData: error.stack,
      });
      process.exitCode = 1;
    });
};

module.exports = harpoonStarter;
