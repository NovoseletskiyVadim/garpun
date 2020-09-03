'use strict';
const path = require('path');
const fs = require('fs');
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
      fs.unlink(pathFile, (err) => {});
      console.log('trash_err');
    }
  );
};
