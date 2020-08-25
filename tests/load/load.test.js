const fs = require('fs');
const path = require('path');
const { resolve } = require('path');
const { rejects } = require('assert');
require('dotenv').config();

let calc = 0;
const addFile = () => {
  const data = new Date().getTime();
  fs.copyFile(
    `c://Users//Alex//Documents//media_test//20200821153229331_CA5402AO_VEHICLE_DETECTION.jpg`,
    `c://Users//Alex//Documents//media_test//${data}_CA5402AO_VEHICLE_DETECTION.jpg`,
    () => {
      calc++;
      while (calc < 1000) {
        return new Promise((resolve, rejects) => {
          setTimeout(resolve(addFile()), 500);
        });
      }
    }
  );
};
addFile();
