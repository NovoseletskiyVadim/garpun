const base64Convertor = require('./../../utils/base64Convertor');
const path = require('path');
const fs = require('fs');
const should = require('chai').should();
const inputFilePath = path.join(
  __dirname,
  `../test_media/watch_folder/input.jpg`
);
const etalonFilePath = path.join(__dirname, `../test_media/etalon.jpg`);
// const resultFilePath = path.join(__dirname, `../test_media/result1.jpg`);
const resultFilePath = 'h:\\result1.jpg';

describe('picture to base64 test', function () {
  before(() => {
    return new Promise((resolve) => {
      const readStr = fs.ReadStream(etalonFilePath);

      const writeStr = fs.WriteStream(inputFilePath);
      readStr.pipe(writeStr);

      writeStr.on('close', () => {
        resolve();
      });
    });
  });

  it('files should be same', function () {
    base64Convertor(inputFilePath).then((data) => {
      const buff = Buffer.from(data, 'base64');
      var etalonBuf = fs.readFileSync(etalonFilePath);
      buff.compare(etalonBuf).should.be.equal(0);
      fs.writeFileSync(resultFilePath, buff);
    });
  });
});
