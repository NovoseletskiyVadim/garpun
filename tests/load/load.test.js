const fs = require('fs');
const path = require('path');
const moment = require('moment');
require('dotenv').config('./../.env');

const cameraNames = [
  'zolotonosha1',
  'zhashkiv1',
  'uman1',
  'chornobay1',
  'gorod1',
  'khrystynivka1',
  'kam1',
  'cherk1',
  'smila1',
  'zhashkiv2',
  'kam3',
  'cherk3',
  'cherk2',
  'zhashkiv4',
  'khrystynivka4',
  'khrystynivka3',
  'khrystynivka2',
  'uman10',
  'uman9',
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
  const time = Math.floor(Math.random() * (5000 - 100)) + 100;

  setTimeout(() => {
    if (calc < 10000) {
      addFile(camName);
    }
  }, time);
};

let workingCams = process.env.TEST_LOAD_CAMS || 1;
if (workingCams > cameraNames.length) {
  console.log('set max cams to ' + cameraNames.length);
  workingCams = cameraNames.length;
}

for (let i = 0; i < workingCams; i++) {
  addFile(cameraNames[i]);
}
