'use strict';
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;

const Logger = require('../logger/appLog');
const logTypes = require('../logger/logTypes');

const logger = Logger();
let today = '';

const oldFilesCleaner = (camName, FILE_DIR) => {
  const dirName = moment()
    .subtract(process.env.ARCHIVE_DAYS, 'days')
    .format('YYYYMMDD');
  const dirToDelete = path.join(process.env[FILE_DIR], camName, dirName);
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dirToDelete)) {
      fs.rmdir(dirToDelete, { recursive: true }, (error) => {
        if (error) {
          logger(logTypes.APP_ERROR, {
            errorType: 'FILE_EXPLORE_ERROR',
            errorData: error.message,
          });
          reject(error);
        }
        const msg = `${FILE_DIR} ${camName} ${dirName} successful cleaned`;
        logger(logTypes.APP_INFO, msg);
        resolve({ res: true, msg });
      });
    } else {
      const msg = `${FILE_DIR} ${camName} nothing to clean`;
      logger(logTypes.APP_INFO, msg);
      resolve({ res: false, msg });
    }
  });
};

const setFileDirPath = (camName, FILE_DIR) => {
  today = moment().format('YYYYMMDD');
  const folderPath = path.join(
    process.env[FILE_DIR],
    camName,
    today.toString()
  );
  if (!fs.existsSync(folderPath)) {
    try {
      fs.mkdirSync(folderPath, { recursive: true });
      oldFilesCleaner(camName, FILE_DIR);
    } catch (error) {
      logger(logTypes.APP_ERROR, {
        errorType: 'FILE_EXPLORE_ERROR',
        errorData: error.message,
      });
    }
  }
  return folderPath;
};

const rejectFileHandler = (fileMeta) => {
  const { fullPath, name: fileName, ext } = fileMeta.file;
  const cameraName = fileMeta.cameraName;
  const fileTrashPath = path.join(
    setFileDirPath(cameraName, 'TRASH_DIR'),
    fileName + ext
  );
  const rd = fs.createReadStream(fullPath);
  const wr = fs.createWriteStream(fileTrashPath);
  return new Promise((resolve, reject) => {
    rd.on('error', reject);
    wr.on('error', reject);
    wr.on('finish', resolve);
    rd.pipe(wr);
  })
    .then((result) => {
      return fsp.unlink(fullPath);
    })
    .catch(function (error) {
      rd.destroy();
      wr.end();
      logger(logTypes.APP_ERROR, {
        errorType: 'FILE_EXPLORE_ERROR',
        errorData: error.message,
      });
    });
};

const base64Convertor = (eventData) => {
  const { fullPath, name: fileName, ext } = eventData.file;
  const { cameraName } = eventData;
  return new Promise((resolve, rejects) => {
    let buf = [];
    const stream = fs.ReadStream(fullPath);
    let wrStream;
    if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
      const archivePath = setFileDirPath(cameraName, 'ARCHIVE_DIR');
      wrStream = fs.WriteStream(path.join(archivePath, fileName + ext));
    }

    stream.on('data', (chunk) => {
      if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
        wrStream.write(chunk);
      }
      buf.push(chunk);
    });

    stream.on('close', () => {
      if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
        wrStream.end();
      }
      const fileInBase64 = Buffer.concat(buf).toString('base64');
      fsp
        .unlink(fullPath)
        .then(() => {
          resolve(fileInBase64);
        })
        .catch((error) => {
          appErrorLog({ message: { text: 'BASE64_DELETE_ERROR', error } });
          console.error(error);
        });
    });

    if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
      wrStream.on('error', (err) => {
        console.log(err);
      });
    }

    stream.on('error', (error) => {
      logger(logTypes.APP_ERROR, {
        errorType: 'FILE_EXPLORE_ERROR',
        errorData: error.message,
      });
      rejects(err);
    });
  });
};

module.exports = {
  oldFilesCleaner,
  setFileDirPath,
  rejectFileHandler,
  base64Convertor,
};
