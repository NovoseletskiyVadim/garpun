const moment = require('moment');
const path = require('path');
const fs = require('fs');
const today = moment().format('YYYYMMDD');
const { appErrorLog } = require('./logger');

const oldFilesCleaner = (camName, FILE_DIR) => {
  const dirName = moment()
    .subtract(process.env.ARCHIVE_DAYS, 'days')
    .format('YYYYMMDD');
  const dirToDelete = path.join(process.env[FILE_DIR], camName, dirName);
  return new Promise((resolve, reject) => {
    if (fs.existsSync(dirToDelete)) {
      fs.rmdir(dirToDelete, { recursive: true }, (err) => {
        if (err) {
          appErrorLog({ message: { text: 'FILE_EXPLORE_ERROR', error } });
          console.error(`FILE_EXPLORE_ERROR ${error.message}`);
          reject(err);
        }
        const msg = `${FILE_DIR} ${camName} ${dirName} successful cleaned`;
        console.log(msg);
        resolve({ res: true, msg });
      });
    } else {
      const msg = `${FILE_DIR} ${camName} nothing to clean`;
      console.log(msg);
      resolve({ res: false, msg });
    }
  });
};

const setFileDirPath = (camName, FILE_DIR) => {
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
      appErrorLog({ message: { text: 'FILE_EXPLORE_ERROR', error } });
    }
  }
  return folderPath;
};

module.exports = { oldFilesCleaner, setFileDirPath };
