const expect = require('chai').expect;
const nock = require('nock');
const moment = require('moment');
const path = require('path');
const fs = require('fs');
const { app, stopAPP } = require('./../../app');

const validStartFile = path.join(
  __dirname,
  `../test_media/20200821153653979_549-A8_VEHICLE_DETECTION.jpg`
);

describe('Full app functional test', (done) => {
  before(() => {
    const camDir = path.join(process.env.MEDIA_PATH, `test_cam/`);
    const timeNow = moment();
    const fileName = `${timeNow.format(
      'YYYYMMDDHHmmssSSS'
    )}_CA5402AO_VEHICLE_DETECTION.jpg`;
    const createFile = new Promise((resolve) => {
      const readStr = fs.ReadStream(validStartFile);
      readStr.on('error', (e) => {
        console.log(e);
      });

      const writeStr = fs.WriteStream(camDir + fileName);
      readStr.pipe(writeStr);

      writeStr.on('close', () => {
        resolve();
      });

      writeStr.on('error', (e) => {
        console.log(e);
      });
    });
    return Promise.all([app, createFile]).catch((error) => {
      console.log(error);
    });
  });

  it('api send status OK', function (done) {
    console.log('sds');
  });

  after(function () {
    // stopAPP();
  });
});

// const validStartFile = path.join(
//   __dirname,
//   `/test_media/20200821153653979_549A8_VEHICLE_DETECTION.jpg`
// );
// const validFileName = `20200821153653979_549A8_VEHICLE_DETECTION.jpg`;
// const badName = '1111.jpg';
// const badStartFile = path.join(__dirname, `../test_media/1111.jpg`);
// const camDir = path.join(__dirname, `../test_media/watch_folder/test_cam/`);
// const responseOK = {
//   req: 'q1w2e3r4t5y6u7i8o9p0',
//   datetime: new Date(),
//   status: 'OK',
// };
// const responseError = {
//   req: 'String',
//   datetime: 'String',
//   error: {
//     name: 'String',
//     statusCode: 500,
//     message: 'String',
//   },
// };

// describe('Full app functional test', function () {
//   describe('Test valid file', function () {
//     beforeEach(() => {
//       const addFile = new Promise((resolve) => {
//         const readStr = fs.ReadStream(validStartFile);
//         readStr.on('error', (e) => {
//           console.log(e);
//         });

//         const writeStr = fs.WriteStream(camDir + validFileName);
//         readStr.pipe(writeStr);

//         writeStr.on('close', () => {
//           resolve();
//         });

//         writeStr.on('error', (e) => {
//           console.log(e);
//         });
//       });
//     });

//     before(() => {
//       return nock(process.env.API_SERVER)
//         .post('/api/CollectMoveVehicles/ReceiveMovementHarpoon')
//         .reply(200, responseOK);
//     });

//     it('api send status OK', function (done) {
//       setTimeout(() => {
//         expect(fs.existsSync(camDir + validFileName)).to.be.false;
//         models.camEvents
//           .findOne({
//             where: {
//               camera: 'test_cam',
//               uploaded: true,
//             },
//           })
//           .then((result) => {
//             expect(result.uploaded).to.be.true;
//             expect(result.fileName).to.equal(
//               '20200821153653979_549A8_VEHICLE_DETECTION'
//             );
//             expect(result.license_plate_number).to.equal('549A8');
//             expect(result.apiResponse.status).to.equal('OK');
//             done();
//           });
//       }, 1900);
//     });

//     before(() => {
//       return nock(process.env.API_SERVER)
//         .post('/api/CollectMoveVehicles/ReceiveMovementHarpoon')
//         .reply(200, responseError);
//     });

//     it('api reject JSON', function (done) {
//       setTimeout(() => {
//         expect(fs.existsSync(camDir + validFileName)).to.be.false;
//         models.camEvents
//           .findOne({
//             where: {
//               camera: 'test_cam',
//               uploaded: false,
//             },
//           })
//           .then((result) => {
//             expect(result.fileName).to.equal(
//               '20200821153653979_549A8_VEHICLE_DETECTION'
//             );
//             expect(
//               fs.existsSync(
//                 path.join(
//                   process.env.TRASH_PATH,
//                   'test_cam',
//                   '20200821153653979_549A8_VEHICLE_DETECTION.jpg'
//                 )
//               )
//             ).to.be.true;
//             expect(result.license_plate_number).to.equal('549A8');
//             expect(result.apiResponse.error.statusCode).to.equal(500);
//             done();
//           });
//       }, 1900);
//     });

//     before(() => {
//       return nock(process.env.API_SERVER)
//         .post('/api/CollectMoveVehicles/ReceiveMovementHarpoon')
//         .reply(400, responseError);
//     });

//     it('api server ERROR', function (done) {
//       setTimeout(() => {
//         expect(fs.existsSync(camDir + validFileName)).to.be.true;
//         models.pendingList
//           .findOne({
//             where: {
//               status: 'REQUEST_REJECTED',
//             },
//           })
//           .then((result) => {
//             expect(result.fileMeta.isValid).to.be.true;
//             fs.unlinkSync(camDir + validFileName);
//             done();
//           });
//       }, 1900);
//     });
//   });

// describe('Test not valid file', function () {
//   before(() => {
//     return new Promise((resolve) => {
//       const readStr = fs.ReadStream(badStartFile);
//       readStr.on('error', (e) => {
//         console.log(e);
//       });

//       const writeStr = fs.WriteStream(camDir + badName);
//       readStr.pipe(writeStr);

//       writeStr.on('close', () => {
//         resolve();
//       });

//       writeStr.on('error', (e) => {
//         console.log(e);
//       });
//     });
//   });

//   it('file type, name is not valid', function (done) {
//     setTimeout(() => {
//       expect(
//         fs.existsSync(path.join(process.env.TRASH_PATH, 'test_cam', badName))
//       ).to.be.true;
//       done();
//     }, 1900);
//   });
// });

//   after(function () {
//     stopAPP();
//   });
// });
