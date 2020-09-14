'use strict';
const fs = require('fs');
const path = require('path');
const { appErrorLog } = require('./logger');

module.exports = (fileMeta) => {
  const pathFile = fileMeta.file.fullPath;
  const cameraName = fileMeta.cameraName;
  const fileName = fileMeta.file.name;
  const trashPath = process.env.TRASH_PATH + cameraName;
  return new Promise((resolve, reject) => {
    if (!fs.existsSync(process.env.TRASH_PATH)) {
      try {
        fs.mkdirSync(process.env.TRASH_PATH);
      } catch (error) {
        appErrorLog({ message: { text: 'TRASH_FOLDER_ERROR', error: error } });
      }
    }
    if (!fs.existsSync(trashPath)) {
      try {
        fs.mkdirSync(trashPath);
      } catch (error) {
        appErrorLog({ message: { text: 'TRASH_FOLDER_ERROR', error: error } });
      }
    }
    fs.copyFile(
      pathFile,
      trashPath + path.sep + fileName + fileMeta.file.ext,
      (error) => {
        if (error) {
          appErrorLog({ message: { text: 'TRASH_COPY_ERROR', error: error } });
        }

        fs.unlink(pathFile, (error) => {
          if (error) {
            appErrorLog({
              message: { text: 'TRASH_DELETE_ERROR', error: error },
            });
          }
          resolve(true);
        });
      }
    );
  });
};
