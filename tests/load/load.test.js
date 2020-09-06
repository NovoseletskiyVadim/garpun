const fs = require('fs');
const path = require('path');
const moment = require('moment');
require('dotenv').config('./../.env');

const cameraNames = [
  'q',
  'w',
  'e',
  'r',
  't',
  'y',
  'u',
  'i',
  'o',
  'p',
  'a',
  's',
  'd',
  'f',
  'g',
  'h',
  'j',
  'k',
  'l',
];
let calc = 1;
let calcByFold = {};
const addFile = (camName) => {
  if (calcByFold[camName] === undefined) {
    calcByFold[camName] = 1;
  } else {
    calcByFold[camName] += 1;
  }

  const date = moment().format('YYYYMMDDHHmmssSSS');

  const sourceFile = process.env.TEST_SOURCE_FILE;
  const inputFolder = path.join(process.env.MEDIA_PATH, camName);
  if (!fs.existsSync(inputFolder)) {
    fs.mkdirSync(inputFolder);
  }

  const filePath = path.join(
    process.env.MEDIA_PATH,
    camName,
    `${date}_CA5402AO_VEHICLE_DETECTION.jpg`
  );
  console.log(calc, { camName: camName }, date, calcByFold);
  fs.copyFile(sourceFile, filePath, function (e) {
    if (e) {
      console.log('copy', e);
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
  addFile(cameraNames[i]);
}
