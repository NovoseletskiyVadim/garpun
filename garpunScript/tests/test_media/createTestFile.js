const path = require('path');
const fs = require('fs');

const moment = require('moment');

require('dotenv').config({ path: '../../.env' });

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
      const readStr = fs.ReadStream(inFilePath);
      readStr.on('error', (e) => {
        console.log(e);
      });

      const writeStr = fs.WriteStream(outFilePath);
      readStr.pipe(writeStr);

      writeStr.on('close', () => {
        resolve();
      });

      writeStr.on('error', (e) => {
        console.log(e);
      });
    });
  }
  validFile(cameraName = this.cameraNameForAll) {
    const fileName = `${this.setTimeStamp()}_CA0000AT_VEHICLE_DETECTION.jpg`;
    const filePath = path.join(process.env.MEDIA_PATH, cameraName, fileName);
    this.createFile(this.goodFilePath, filePath);
    return this;
  }
  wrongNameFile(cameraName = this.cameraNameForAll) {
    const fileName = `${this.setTimeStamp()}_noPlate_VEHICLE_DETECTION.jpg`;
    const filePath = path.join(process.env.MEDIA_PATH, cameraName, fileName);
    this.createFile(this.goodFilePath, filePath);
    return this;
  }
  wrongTypeFile(cameraName = this.cameraNameForAll) {
    const fileName = `${this.setTimeStamp()}_CA1111AT_VEHICLE_DETECTION.jpg`;
    const filePath = path.join(process.env.MEDIA_PATH, cameraName, fileName);
    this.createFile(this.badTypeFile, filePath);
    return this;
  }
  wrongTimeFile(cameraName = this.cameraNameForAll) {
    const fileName = `20201015082313898_CA2222AT_VEHICLE_DETECTION.jpg`;
    const filePath = path.join(process.env.MEDIA_PATH, cameraName, fileName);
    this.createFile(this.goodFilePath, filePath);
    return this;
  }
  wrongSizeFile(cameraName = this.cameraNameForAll) {
    const fileName = `20201015082313898_CA3333AT_VEHICLE_DETECTION.jpg`;
    const filePath = path.join(process.env.MEDIA_PATH, cameraName, fileName);
    this.createFile(this.badSizeFile, filePath);
    return this;
  }
}

const create = new TestFileCreator('test_cam_ok');
const files = [];
// for (let index = 0; index < 100; index++) {

//   setTimeout(() => {
//     console.log(index);
//     create.validFile();
//   }, 500);
// }
create.validFile();
// create.wrongNameFile();
create.wrongSizeFile();
//   .wrongTimeFile()
//   .wrongTypeFile()
//   .validFile('test_cam_uuid')
//   .validFile('test_cam_name')
//   .validFile('test_cam_not_exist')
//   .validFile('test_cam_posit');
