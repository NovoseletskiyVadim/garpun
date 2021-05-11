'use strict';
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const fsp = require('fs').promises;

const { printLog, logTypes } = require('../logger/appLogger');

let today = '';

const oldFilesCleaner = (camName, FILE_DIR) => {
  const dirToClean = path.join(process.env[FILE_DIR], camName);
  return fsp
    .readdir(dirToClean)
    .then((files) => {
      if (!files.length) {
        const msg = `${FILE_DIR} ${camName} nothing to clean`;
        printLog(logTypes.APP_INFO, msg);
        return msg;
      }
      let shouldBeSaved = [];
      for (let index = 0; index < process.env.ARCHIVE_DAYS; index++) {
        const dayName = moment().subtract(index, 'days').format('YYYYMMDD');
        shouldBeSaved.push(dayName);
      }
      const shouldBeDeleted = files.filter((file) => {
        const index = shouldBeSaved.indexOf(file);
        if (index < 0) {
          return true;
        }
      });
      if (!shouldBeDeleted.length) {
        const msg = `${FILE_DIR} ${camName} nothing to clean`;
        printLog(logTypes.APP_INFO, msg);
        return msg;
      }
      const fileList = shouldBeDeleted.map((file) => {
        const dirToDelete = path.join(process.env[FILE_DIR], camName, file);
        return fsp.rmdir(dirToDelete, { recursive: true });
      });
      return Promise.all(fileList)
        .then((res) => {
          const msg = `${FILE_DIR} of ${camName} successful cleaned`;
          printLog(logTypes.APP_INFO, msg);
          return msg;
        })
        .catch((err) => {
          console.log(err);
        });
    })
    .catch((error) => {
      printLog(logTypes.APP_ERROR, {
        errorType: 'FILE_EXPLORE_ERROR',
        errorData: error.message,
      });
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
      printLog(logTypes.APP_ERROR, {
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
      printLog(logTypes.APP_ERROR, {
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
          printLog(logTypes.APP_ERROR, {
            errorType: 'BASE64_DELETE_ERROR',
            errorData: error.message,
          });
        });
    });

    if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
      wrStream.on('error', (error) => {
        printLog(logTypes.APP_ERROR, {
          errorType: 'FILE_ARCHIVE_ERROR',
          errorData: error.message,
        });
      });
    }

    stream.on('error', (error) => {
      printLog(logTypes.APP_ERROR, {
        errorType: 'FILE_EXPLORE_ERROR',
        errorData: error.message,
      });
      rejects(error);
    });
  });
};

module.exports = {
  oldFilesCleaner,
  setFileDirPath,
  rejectFileHandler,
  base64Convertor,
};
