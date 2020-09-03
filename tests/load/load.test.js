const fs = require('fs');
const moment = require('moment');

let calc = 0;
const addFile = (camName) => {
  const date = moment().format('YYYYMMDDHHmmssSSS');
  const filePath = `h://media_test//${camName}//${date}_CA5402AO_VEHICLE_DETECTION.jpg`;
  if (!fs.existsSync(`h://media_test//${camName}`)) {
    fs.mkdirSync(`h://media_test//${camName}`);
  }
  console.log(camName, calc, date);
  fs.copyFile(
    `C://Users//Alex//Downloads//GP//GP//media//zolotonosha1//20200821153653979_549A8_VEHICLE_DETECTION.jpg`,
    filePath,
    function (e) {
      if (e) {
        console.log(e);
      }
    }
  );
  calc++;
  const time = Math.floor(Math.random() * (30000 - 100)) + 100;

  setTimeout(() => {
    if (calc < 1000) {
      addFile(camName);
    }
  }, time);
};

for (let i = 0; i < 10; i++) {
  addFile(i);
}
