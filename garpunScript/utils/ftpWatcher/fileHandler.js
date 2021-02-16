const fs = require('fs');

const FileType = require('file-type');

const appLogger = require('../logger/appLogger');
const logTypes = require('../logger/logTypes');
const { camerasWatcher } = require('../childProcesses');
const getFileMeta = require('../fileExplorer/getFileMeta');
const CamEvents = require('../../models/camEvent');
const { rejectFileHandler } = require('../fileExplorer/fileExplorer');
const PendingList = require('../../models/pendingList');
const jsonSender = require('../jsonSender/jsonSender');
const jsonCreator = require('../jsonSender/jsonCreator');

module.exports = (pathFile) => {
  let fileMeta = getFileMeta(pathFile);
  camerasWatcher.send({ type: 'EVENT', data: fileMeta.cameraName });
  return FileType.fromFile(pathFile)
    .then((fileType) => {
      if (!fileType || fileType.ext !== 'jpg') {
        fileMeta.isValid = false;
        fileMeta.notPassed.push('FILE_TYPE');
      }
      return true;
    })
    .then(() => {
      try {
        const fileSize = fs.statSync(pathFile).size;
        if (fileSize > parseInt(process.env.MAX_FILE_SIZE, 10)) {
          fileMeta.isValid = false;
          fileMeta.notPassed.push('FILE_SIZE');
        }
      } catch (error) {
        return Promise.reject(new Error(error));
      }
      return true;
    })
    .then(() => {
      const dataToLocalDB = {
        uuid: fileMeta.uuid,
        time: fileMeta.isValid ? fileMeta.eventDate : null,
        license_plate_number: fileMeta.isValid ? fileMeta.plateNumber : null,
        camera: fileMeta.cameraName,
        fileName: fileMeta.file.name + fileMeta.file.ext,
        fileErrors: fileMeta.notPassed.join(),
      };
      return CamEvents.create(dataToLocalDB).then((savedEvent) => {
        if (fileMeta.isValid) {
          return jsonCreator({
            cameraName: fileMeta.cameraName,
            plateNumber: fileMeta.plateNumber,
            datetime: fileMeta.eventDate,
            uuid: fileMeta.uuid,
            file: fileMeta.file,
          }).then((jsonToSend) => {
            return jsonSender(jsonToSend)
              .then((result) => {
                const { isSent, apiResponse } = result;
                const eventData = {
                  sender: 'SEND',
                  apiResponse,
                  camera: cameraName,
                  fileName: file.name + file.ext,
                  time: eventDate,
                };
                savedEvent.apiResponse = apiResponse;
                savedEvent.uploaded = isSent;
                appLogger.printLog(logTypes.JSON_SENT, eventData);
                return savedEvent.save();
              })
              .catch((error) => {
                appLogger.printLog(logTypes.API_ERROR, {
                  statusCode: error.statusCode,
                  errorText: error.errorText,
                  apiURL: error.apiURL,
                  senderName: 'SEND',
                  cameraName: fileMeta.cameraName,
                  file: fileMeta.file.name + fileMeta.file.ext,
                });
                return PendingList.create({
                  status: 'API_ERROR',
                  data: jsonToSend,
                  dbID: savedEvent.id,
                  fileMeta,
                });
              });
          });
        } else {
          appLogger.printLog(
            logTypes.WRONG_FILE,
            `WRONG ${fileMeta.notPassed.join(' ')} camera:${
              fileMeta.cameraName
            } photo:${fileMeta.file.name}${fileMeta.file.ext}`
          );
          return rejectFileHandler(fileMeta);
        }
      });
    })
    .catch((error) => {
      appLogger.printLog('APP_ERROR', {
        errorType: 'EVENTHANDLER_ERROR',
        errorData: error.stack,
      });
    });
};
