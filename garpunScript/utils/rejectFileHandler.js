'use strict';
const fs = require('fs');
const path = require('path');
const fileExplorer = require('./fileExplorer');
const { appErrorLog } = require('./logger');

module.exports = (fileMeta) => {
  const pathFile = fileMeta.file.fullPath;
  const cameraName = fileMeta.cameraName;
  const fileName = fileMeta.file.name;
  const trashPath = fileExplorer.setFileDirPath(cameraName, 'TRASH_PATH');

  return new Promise((resolve, reject) => {
    fs.copyFile(
      pathFile,
      trashPath + path.sep + fileName + fileMeta.file.ext,
      (error) => {
        if (error) {
          appErrorLog({ message: { text: 'TRASH_COPY_ERROR', error } });
        }

        fs.unlink(pathFile, (error) => {
          if (error) {
            appErrorLog({
              message: { text: 'TRASH_DELETE_ERROR', error },
            });
          }
          resolve(true);
        });
      }
    );
  });
};
