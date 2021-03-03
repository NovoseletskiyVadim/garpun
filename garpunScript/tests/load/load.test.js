require('dotenv').config({ path: './../../.env' });

const dbConnect = require('./../../db/dbConnect');
const Cameras = require('./../../models/cameras');
const TestFileCreator = require('./../test_media/createTestFile');

const maxFilesCameras = [20, 4, 40, 30, 50, 70];
const setFileType = (calcFiles) => {
  if (calcFiles % 45 === 0) {
    return 'wrongTypeFile';
  } else if (calcFiles % 30 === 0) {
    return 'wrongTimeFile';
  } else if (calcFiles % 20 === 0) {
    return 'wrongSizeFile';
  } else if (calcFiles % 10 === 0) {
    return 'wrongNameFile';
  } else {
    return 'validFile';
  }
};

Cameras.findAll({
  raw: true,
  where: {
    isOnLine: true,
  },
}).then((camerasList) => {
  let filesCreator = [];
  filesCreator = camerasList.map((camera) => {
    return new TestFileCreator(camera.ftpHomeDir);
  });
  filesCreator.forEach((element, i) => {
    let calc = 0;
    const startLoop = () => {
      const res = setTimeout(() => {
        if (maxFilesCameras[i] > calc) {
          calc += 1;
          element[setFileType(calc)]().then((res) => {
            console.log(res);
            startLoop();
          });
        }
      }, 1000);
    };
    startLoop();
  });
});
