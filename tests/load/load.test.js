const fs = require('fs');

let calc = 0;
const addFile = (camName) => {
  const date = new Date().getTime();
  const filePath = `c://Users//Alex//Documents//media_test//${camName}//${date}_CA5402AO_VEHICLE_DETECTION.jpg`;
  if (!fs.existsSync(`c://Users//Alex//Documents//media_test//${camName}`)) {
    fs.mkdirSync(`c://Users//Alex//Documents//media_test//${camName}`);
  }
  console.log(camName, calc, date);
  fs.copyFile(
    `c://Users//Alex//Documents//media_test//20200821153229331_CA5402AO_VEHICLE_DETECTION.jpg`,
    filePath,
    function () {}
  );
  calc++;
  const time = Math.floor(Math.random() * (180000 - 500)) + 500;
  console.log(time);
  setTimeout(() => {
    if (calc < 1000) {
      addFile(camName);
    }
  }, time);
};

for (let i = 0; i < 1; i++) {
  addFile(i);
}
