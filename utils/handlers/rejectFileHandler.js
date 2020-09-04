'use strict';
const path = require('path');
const fs = require('fs');
const appLogger = require('../logger/logger');

module.exports = (pathFile) => {

  const parsedPath = path.parse(pathFile);
  const splittedPath = parsedPath.dir.split(path.sep);
  const cameraName = splittedPath[splittedPath.length - 1];
  const fileName = parsedPath.name;
  const trashPath = process.env.TRESH_PATH + cameraName;

  if (!fs.existsSync(trashPath)) {
    fs.mkdirSync(trashPath);
  }
  fs.copyFile(
    pathFile,
    trashPath + path.sep + fileName + parsedPath.ext,
    (err) => {
      if (err) {
        // TODO: Add logger
        
        appLogger.transferTrashFileLog({

          message:'Error_Transfer_Trash',
          file: `from ${pathFile} to ${trashPath}`

        });
        // console.log('trash_err');
      } else {
        // TODO: Add logger
        fs.unlink(pathFile, (err) => {

          if(err){

            appLogger.delTransferTrashFileLog({
              
              message:'Error_Transfer_Trash',
              file: `file ${pathFile}`

            });

          }

        });
      }
    }
  );
};
