'use strict';
const fs = require('fs');
const path = require('path');

module.exports = (fileMeta) => {
  const pathFile = fileMeta.file.fullPath;
  const cameraName = fileMeta.cameraName;
  const fileName = fileMeta.file.name;
  const trashPath = process.env.TRASH_PATH + cameraName;

  if (!fs.existsSync(process.env.TRASH_PATH)) {
    try {
      fs.mkdirSync(process.env.TRASH_PATH);
    } catch (error) {
      console.error('TRASH_FOLDER_ERROR', error);
    }
  }
  if (!fs.existsSync(trashPath)) {
    try {
      fs.mkdirSync(trashPath);
    } catch (error) {
      console.error('TRASH_FOLDER_ERROR', error);
    }
  }
  fs.copyFile(
    pathFile,
    trashPath + path.sep + fileName + fileMeta.file.ext,
    (error) => {
      if (error) {
        console.error('TRASH_COPY_ERROR', error);
      }

      fs.unlink(pathFile, (error) => {
        if (error) {
          console.error('TRASH_DELETE_ERROR', error);
        }
      });
    }
  );
};
