/* eslint-disable no-param-reassign */
const fs = require('fs');

const FileType = require('file-type');

const { MAX_FILE_SIZE } = require('../../common/config');
const { printLog } = require('../logger/appLogger');
const { camerasWatcher } = require('../childProcesses');
const getFileMeta = require('../fileExplorer/getFileMeta');
const CamEvents = require('../../models/camEvent');
const { rejectFileHandler } = require('../fileExplorer/fileExplorer');
const PendingList = require('../../models/pendingList');
const jsonSender = require('../jsonSender/jsonSender');
const jsonCreator = require('../jsonSender/jsonCreator');
const SuccessfulResponseHandler = require('../jsonSender/successfulResponseHandler');
const {
    AppError,
    JsonSenderError,
    EventHandlerError,
} = require('../errorHandlers');

const MODULE_NAME = 'FILE_HANDLER';

module.exports = (pathFile, emitter = MODULE_NAME) => {
    const fileStat = fs.statSync(pathFile);
    if (!fileStat.isFile()) {
        printLog(`NOT A FILE ${pathFile}`).errorSecond();
        return Promise.resolve();
    }
    const fileMeta = getFileMeta(pathFile);
    camerasWatcher.send({ type: 'EVENT', data: fileMeta.cameraName });
    // Check file format should be jpg
    return (
        FileType.fromFile(pathFile)
            .then((fileType) => {
                if (!fileType || fileType.ext !== 'jpg') {
                    fileMeta.isValid = false;
                    fileMeta.notPassed.push('FILE_TYPE');
                }
                return true;
            })
            // Check file size ENV  MAX_FILE_SIZE
            .then(() => {
                const fileSize = fileStat.size;
                if (fileSize > MAX_FILE_SIZE) {
                    fileMeta.isValid = false;
                    fileMeta.notPassed.push('FILE_SIZE');
                }
                return true;
            })
            .then(() => {
                // Save ivent in db
                const dataToLocalDB = {
                    uuid: fileMeta.uuid,
                    time: fileMeta.isValid ? fileMeta.eventDate : null,
                    license_plate_number: fileMeta.isValid
                        ? fileMeta.plateNumber
                        : null,
                    camera: fileMeta.cameraName,
                    fileName: fileMeta.file.name + fileMeta.file.ext,
                    fileErrors: fileMeta.notPassed.join(),
                };
                return CamEvents.create(dataToLocalDB);
            })
            .then((savedEvent) => {
                if (fileMeta.isValid) {
                    // Create json for send to API and move file to archive folder or if ARCHIVE_DAYS = 0 - delete
                    return jsonCreator({
                        cameraName: fileMeta.cameraName,
                        plateNumber: fileMeta.plateNumber,
                        datetime: fileMeta.eventDate,
                        uuid: fileMeta.uuid,
                        file: fileMeta.file,
                    }).then((jsonToSend) =>
                        // Send json to api
                        jsonSender(jsonToSend)
                            .then((result) => {
                                const { isSent, apiResponse } = result;
                                const eventData = {
                                    sender: `[${emitter}]`,
                                    apiResponse,
                                    camera: fileMeta.cameraName,
                                    fileName:
                                        fileMeta.file.name + fileMeta.file.ext,
                                    time: fileMeta.eventDate,
                                };
                                const logData = printLog(
                                    new SuccessfulResponseHandler(
                                        eventData
                                    ).toPrint()
                                );
                                if (!isSent || fileMeta.notPassed.length) {
                                    logData.warning();
                                } else {
                                    logData.successful();
                                }
                                savedEvent.apiResponse = apiResponse;
                                savedEvent.uploaded = isSent;
                                // Save API request in db
                                return savedEvent.save();
                            })
                            .catch((error) => {
                                if (error instanceof JsonSenderError) {
                                    printLog(
                                        new EventHandlerError(error, {
                                            senderName: emitter,
                                            fileMeta,
                                        }).toPrint()
                                    ).error();
                                    // If API no response or response not valid, save event to temp db for re-send
                                    return PendingList.create({
                                        status: 'API_ERROR',
                                        data: jsonToSend,
                                        dbID: savedEvent.id,
                                        fileMeta,
                                    });
                                }
                                printLog(
                                    new AppError(error, MODULE_NAME).toPrint()
                                ).error();
                                return false;
                            })
                    );
                }
                printLog(
                    `WRONG ${fileMeta.notPassed.join(' ')} camera:${
                        fileMeta.cameraName
                    } photo:${fileMeta.file.name}${fileMeta.file.ext}`
                ).errorSecond();
                // If file is not valid move to trash folder or if ARCHIVE_DAYS = 0 - delete
                return rejectFileHandler(fileMeta);
            })
            .catch((error) => {
                printLog(new AppError(error, MODULE_NAME).toPrint());
            })
    );
};
