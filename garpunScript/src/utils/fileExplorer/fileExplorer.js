const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');

const moment = require('moment');

const { printLog } = require('../logger/appLogger');
const {
    TRASH_ARCHIVE_DAYS,
    ARCHIVE_DAYS,
    TRASH_DIR,
    ARCHIVE_DIR,
} = require('../../common/config');
const { AppError } = require('../errorHandlers/index');

const configurator = {
    TRASH: { dirPath: TRASH_DIR, archiveDays: TRASH_ARCHIVE_DAYS },
    ARCHIVE: { dirPath: ARCHIVE_DIR, archiveDays: ARCHIVE_DAYS },
};
/**
 * @function oldFilesCleaner
 * @description For cleaning files in archive or trash older than set archive time
 * @param {string} camName
 * @param {string} FILE_TYPE TRASH or ARCHIVE
 * @returns {Promise}
 */
const oldFilesCleaner = (camName, FILE_TYPE) => {
    const { dirPath, archiveDays } = configurator[FILE_TYPE];
    const dirToClean = path.join(dirPath, camName);
    try {
        if (!fs.existsSync(dirToClean)) {
            const msg = `${FILE_TYPE} for ${camName} nothing to clean`;
            printLog(msg).appInfoMessage();
            return Promise.resolve(msg);
        }
    } catch (error) {
        printLog(new AppError(error, 'FILE_EXPLORE_ERROR'))
            .error()
            .toErrorLog()
            .errorGroupChatMessage();
    }
    return fsp
        .readdir(dirToClean)
        .then((files) => {
            if (!files.length) {
                const msg = `${FILE_TYPE} for ${camName} nothing to clean`;
                printLog(msg).appInfoMessage();
                return msg;
            }
            const shouldBeSaved = [];
            for (let index = 0; index < archiveDays; index += 1) {
                const dayName = moment()
                    .subtract(index, 'days')
                    .format('YYYYMMDD');
                shouldBeSaved.push(dayName);
            }

            const shouldBeDeleted = files.filter(
                (file) => !shouldBeSaved.includes(file)
            );

            if (!shouldBeDeleted.length) {
                const msg = `${FILE_TYPE} for ${camName} nothing to clean`;
                printLog(msg).appInfoMessage();
                return msg;
            }
            const fileList = shouldBeDeleted.map((file) => {
                const dirToDelete = path.join(
                    configurator[FILE_TYPE].dirPath,
                    camName,
                    file
                );
                return fsp.rmdir(dirToDelete, { recursive: true });
            });
            return Promise.all(fileList).then(() => {
                const msg = `${FILE_TYPE} of ${camName} successful cleaned by ${shouldBeDeleted.join(
                    ', '
                )}`;
                printLog(msg).appInfoMessage();
                return msg;
            });
        })
        .catch((error) => {
            printLog(new AppError(error, 'FILE_EXPLORE_ERROR'))
                .error()
                .toErrorLog()
                .errorGroupChatMessage();
        });
};
/**
 * @function setFileDirPath
 * @description  For create new folder in archive or trash is it not exist
 * @param {string} camName
 * @param {string} FILE_TYPE TRASH or ARCHIVE
 * @returns {object} data
 * @returns {string} data.isNewFolder
 * @returns {string} data.folderPath
 */
const getFileDirPath = (camName, FILE_TYPE) => {
    const { dirPath } = configurator[FILE_TYPE];
    const today = moment().format('YYYYMMDD');
    let isNewFolder = false;
    const folderPath = path.join(dirPath, camName, today.toString());
    if (!fs.existsSync(folderPath)) {
        try {
            fs.mkdirSync(folderPath, { recursive: true });
            isNewFolder = true;
        } catch (error) {
            printLog(new AppError(error, 'FILE_EXPLORE_ERROR'))
                .error()
                .toErrorLog()
                .errorGroupChatMessage();
        }
    }
    return { folderPath, isNewFolder };
};
/**
 * @function rejectFileHandler
 * @description For handle not valid file if TRASH_ARCHIVE_DAYS === 0 delete
 * @returns {Promise}
 * @param {string} fileMeta.fullPath
 * @param {object} fileMeta.name
 * @param {object} fileMeta.ext
 * @returns {Promise}
 */
const rejectFileHandler = (fileMeta) => {
    const { fullPath, name: fileName, ext } = fileMeta.file;
    if (TRASH_ARCHIVE_DAYS === 0) {
        return fsp.unlink(fullPath);
    }
    const { cameraName } = fileMeta;
    const dirPath = getFileDirPath(cameraName, 'TRASH');
    if (dirPath.isNewFolder) {
        oldFilesCleaner(cameraName, 'TRASH');
    }
    const fileTrashPath = path.join(dirPath.folderPath, fileName + ext);
    const rd = fs.createReadStream(fullPath);
    const wr = fs.createWriteStream(fileTrashPath);
    return new Promise((resolve, reject) => {
        rd.on('error', reject);
        wr.on('error', reject);
        wr.on('finish', resolve);
        rd.pipe(wr);
    })
        .then(() => fsp.unlink(fullPath))
        .catch((error) => {
            rd.destroy();
            wr.end();
            printLog(new AppError(error, 'FILE_EXPLORE_ERROR'))
                .error()
                .toErrorLog()
                .errorGroupChatMessage();
        });
};
/**
 * @function base64Convertor
 * @description For convert file to base64 and after if ARCHIVE_DAYS > 0 save to the archive else delete
 * @param {Object} eventData
 * @param {Object} eventData.file - Stat about file
 * @param {Object} eventData.file.fullPath
 * @param {Object} eventData.file.name
 * @param {Object} eventData.file.ext
 * @param {string} eventData.cameraName - Name of the camera
 * @returns {Promise}
 */
const base64Convertor = (eventData) => {
    const { cameraName, file } = eventData;
    const { fullPath, name: fileName, ext } = file;

    return new Promise((resolve, rejects) => {
        const buf = [];
        const stream = fs.ReadStream(fullPath);
        let wrStream;
        if (ARCHIVE_DAYS > 0) {
            const archivePath = getFileDirPath(cameraName, 'ARCHIVE');
            if (archivePath.isNewFolder) {
                oldFilesCleaner(cameraName, 'ARCHIVE');
            }
            wrStream = fs.WriteStream(
                path.join(archivePath.folderPath, fileName + ext)
            );
        }

        stream.on('data', (chunk) => {
            if (ARCHIVE_DAYS > 0) {
                wrStream.write(chunk);
            }
            buf.push(chunk);
        });

        stream.on('close', () => {
            if (ARCHIVE_DAYS > 0) {
                wrStream.end();
            }
            const fileInBase64 = Buffer.concat(buf).toString('base64');
            fsp.unlink(fullPath)
                .then(() => {
                    resolve(fileInBase64);
                })
                .catch((error) => {
                    printLog(new AppError(error, 'BASE64_DELETE_ERROR'))
                        .error()
                        .toErrorLog()
                        .errorGroupChatMessage();
                });
        });

        if (ARCHIVE_DAYS > 0) {
            wrStream.on('error', (error) => {
                printLog(new AppError(error, 'FILE_EXPLORE_ERROR'))
                    .error()
                    .toErrorLog()
                    .errorGroupChatMessage();
            });
        }

        stream.on('error', (error) => {
            printLog(new AppError(error, 'FILE_EXPLORE_ERROR'))
                .error()
                .toErrorLog()
                .errorGroupChatMessage();
            rejects(error);
        });
    });
};

module.exports = {
    oldFilesCleaner,
    rejectFileHandler,
    base64Convertor,
    getFileDirPath,
};
