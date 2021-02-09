require('dotenv').config({ path: '../../.env' });
const path = require('path');
const fs = require('fs');
const expect = require('chai').expect;
const nock = require('nock');
const jsonSender = require('./../../utils/jsonSender');
const fileMeta = {
  cameraName: 'test_cam',
  file: {
    name: 'test_not_valid_photo',
    fullPath: path.join(__dirname, `../test_media/watch_folder/input.jpg`),
    ext: '.jpg',
  },
};
const inputFilePath = path.join(
  __dirname,
  `../test_media/watch_folder/input.jpg`
);
const etalonFilePath = path.join(__dirname, `../test_media/etalon.jpg`);
const responseOK = {
  req: 'q1w2e3r4t5y6u7i8o9p0',
  datetime: new Date(),
  status: 'OK',
};
const responseError = {
  req: 'String',
  datetime: 'String',
  error: {
    name: 'String',
    statusCode: 500,
    message: 'String',
  },
};

describe('Test jsonSender ', function () {
  describe('API res with status 200 and JSON accepted', function () {
    beforeEach(() => {
      const addFile = new Promise((resolve) => {
        const readStr = fs.ReadStream(etalonFilePath);

        const writeStr = fs.WriteStream(inputFilePath);
        readStr.pipe(writeStr);

        writeStr.on('close', () => {
          resolve();
        });
      });

      const server = nock(process.env.API_SERVER)
        .post('/CollectMoveVehicles/ReceiveMovementHarpoon')
        .reply(200, responseOK);
      return Promise.all([addFile, server]);
    });

    it('api send status OK', (done) => {
      jsonSender({ data: 'sss' }, fileMeta)
        .then((apiRes) => {
          expect(apiRes).to.contain.keys('apiResponse', 'uploaded');
          expect(apiRes.uploaded).to.be.true;
          expect(apiRes.apiResponse).to.contain.keys(
            'req',
            'datetime',
            'status'
          );
          expect(apiRes.apiResponse.status).to.equal('OK');
          expect(fs.existsSync(fileMeta.file.fullPath)).to.be.false;
          expect(fs.existsSync(fileMeta.file.fullPath)).to.be.false;
          done();
        })
        .catch((err) => {
          console.log(err);
        });
    });
  });

  describe('API res with status 200 and JSON not accepted', function () {
    beforeEach(() => {
      const addFile = new Promise((resolve) => {
        const readStr = fs.ReadStream(etalonFilePath);

        const writeStr = fs.WriteStream(inputFilePath);
        readStr.pipe(writeStr);

        writeStr.on('close', () => {
          resolve();
        });
      });

      const server = nock(process.env.API_SERVER)
        .post('/CollectMoveVehicles/ReceiveMovementHarpoon')
        .reply(200, responseError);
      return Promise.all([addFile, server]);
    });

    it('api send ERROR', (done) => {
      jsonSender({ data: 'sss' }, fileMeta).then((apiRes) => {
        console.log(apiRes);
        expect(apiRes).to.contain.keys('apiResponse', 'uploaded');
        expect(apiRes.uploaded).to.be.false;
        expect(apiRes.apiResponse).to.contain.keys('req', 'datetime', 'error');
        expect(apiRes.apiResponse.error.statusCode).to.equal(500);
        expect(fs.existsSync(fileMeta.file.fullPath)).to.be.false;
        expect(
          fs.existsSync(
            path.join(
              process.env.TRASH_PATH,
              fileMeta.cameraName,
              `${fileMeta.file.name}${fileMeta.file.ext}`
            )
          )
        ).to.be.true;
        done();
      });
    });
  });
  // it('file for delete not found should be ENOENT', function () {
  //   jsonSender('as', fileMeta)
  //     .then((res) => {
  //       console.log(res);
  //     })
  //     .catch((err) => {
  //       console.log(err.code);
  //     });
  // });
});
