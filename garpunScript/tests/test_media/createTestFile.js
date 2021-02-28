const path = require('path');
const fs = require('fs');

const moment = require('moment');
class TestFileCreator {
  constructor(cameraName) {
    this.cameraNameForAll = cameraName;
    this.goodFilePath = './fileOk.jpg';
    this.badSizeFile = './badSize.jpg';
    this.badTypeFile = './badType.jpg';
  }
  setTimeStamp() {
    const timeNow = moment();
    const timeStamp = timeNow.format('YYYYMMDDHHmmssSSS');
    return timeStamp;
  }
  createFile(inFilePath, outFilePath) {
    return new Promise((resolve) => {
      function ensureDirectoryExistence(filePath) {
        var dirname = path.dirname(filePath);
        if (fs.existsSync(dirname)) {
          return true;
        }
        ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
      }
      const readStr = fs.ReadStream(path.join(__dirname, inFilePath));
      readStr.on('error', (e) => {
        console.log(e);
      });

      try {
        if (ensureDirectoryExistence(outFilePath)) {
          const writeStr = fs.WriteStream(outFilePath);
          readStr.pipe(writeStr);

          writeStr.on('close', () => {
            resolve(`CREATE_OK ${outFilePath}`);
          });

          writeStr.on('error', (e) => {
            console.log(e);
          });
        }
      } catch (error) {
        console.log(error);
      }
    });
  }
  validFile(cameraName = this.cameraNameForAll) {
    const fileName = `${this.setTimeStamp()}_CA0000AT_VEHICLE_DETECTION.jpg`;
    const filePath = path.join(process.env.MEDIA_PATH, cameraName, fileName);
    return this.createFile(this.goodFilePath, filePath);
  }
  wrongNameFile(cameraName = this.cameraNameForAll) {
    const fileName = `${this.setTimeStamp()}_noPlate_VEHICLE_DETECTION.jpg`;
    const filePath = path.join(process.env.MEDIA_PATH, cameraName, fileName);
    return this.createFile(this.goodFilePath, filePath);
  }
  wrongTypeFile(cameraName = this.cameraNameForAll) {
    const fileName = `${this.setTimeStamp()}_CA1111AT_VEHICLE_DETECTION.jpg`;
    const filePath = path.join(process.env.MEDIA_PATH, cameraName, fileName);
    return this.createFile(this.badTypeFile, filePath);
  }
  wrongTimeFile(cameraName = this.cameraNameForAll) {
    const fileName = `20201015082313898_CA2222AT_VEHICLE_DETECTION.jpg`;
    const filePath = path.join(process.env.MEDIA_PATH, cameraName, fileName);
    return this.createFile(this.goodFilePath, filePath);
  }
  wrongSizeFile(cameraName = this.cameraNameForAll) {
    const fileName = `20201015082313898_CA3333AT_VEHICLE_DETECTION.jpg`;
    const filePath = path.join(process.env.MEDIA_PATH, cameraName, fileName);
    return this.createFile(this.badSizeFile, filePath);
  }
}
module.exports = TestFileCreator;
