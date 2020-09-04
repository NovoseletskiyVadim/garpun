const fs = require('fs');
const path = require('path');
const moment = require('moment');
require('dotenv').config('./../.env');

let calc = 0;
let calcByFold = {};
const addFile = (camName) => {
  if (calcByFold[camName] === undefined) {
    calcByFold[camName] = 1;
  } else {
    calcByFold[camName] += 1;
  }

  const date = moment().format('YYYYMMDDHHmmssSSS');

  const sourceFile = process.env.TEST_SOURCE_FILE;
  const inputFolder = path.join(process.env.MEDIA_PATH, camName.toString());
  const filePath = path.join(
    process.env.MEDIA_PATH,
    camName.toString(),
    `${date}_CA5402AO_VEHICLE_DETECTION.jpg`
  );
  if (!fs.existsSync(inputFolder)) {
    fs.mkdirSync(inputFolder);
  }
  console.log(camName, calc, date, calcByFold);
  fs.copyFile(sourceFile, filePath, function (e) {
    if (e) {
      console.log(e);
    }
  });
  calc++;
  const time = Math.floor(Math.random() * (30000 - 100)) + 100;

  setTimeout(() => {
    if (calc < 1000) {
      addFile(camName);
    }
  }, time);
};

const workingCams = process.env.TEST_LOAD_CAMS || 1;

for (let i = 0; i < workingCams; i++) {
  addFile(i);
}
