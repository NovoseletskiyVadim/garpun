require('dotenv').config();

require('../../src/db/dbConnect');
const Cameras = require('../../src/models/cameras');
const TestFileCreator = require('../test_media/createTestFile');


// new TestFileCreator('Cherk_park_50').wrongTimeFile();

const maxFilesCameras = [100, 4, 40, 30, 50, 70];
const setFileType = (calcFiles) => {
  if (calcFiles % 45 === 0) {
    return 'wrongTypeFile';
  } 

  if (calcFiles % 30 === 0) {
    return 'wrongTimeFile';
  } 

  if (calcFiles % 20 === 0) {
    return 'wrongSizeFile';
  } 

  if (calcFiles % 10 === 0) {
    return 'wrongNameFile';
  } 
    return 'validFile';

};

Cameras.findAll({
  raw: true,
  where: {
    isOnLine: true,
  },
})
  .then((camerasList) => {
    let filesCreator = [];
    filesCreator = camerasList.map((camera) => new TestFileCreator(camera.ftpHomeDir));
    filesCreator.forEach((element, i) => {
      let calc = 0;
      const startLoop = () => {
        const base = setTimeout(() => {
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
  })
  .catch(console.error);
