const expect = require('chai').expect;
const nock = require('nock');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config({ path: '../../.env' });
const RejectWatcher = require('./../../utils/jsonResenderProcess/watcher');
const jsonResend = require('./../../utils/jsonResenderProcess/resender');
const dbConnect = require('../../db/dbConnect');

process.env.NODE_ENV = 'DEV';

const watcher = new RejectWatcher(jsonResend);

describe('Test jsonReSender full test', () => {
  before(() => {
    let mockEventList = [];
    let mockPendingList = [];
    for (let index = 0; index < 11; index++) {
      const uuid = uuidv4();
      mockEventList.push({
        uuid,
        time: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
        license_plate_number: 'NUMBER',
        camera: 'testCam',
        apiResponse: '',
        fileName: 'test_file',
      });
      mockPendingList.push({
        status: 500,
        data: '',
        dbID: uuid,
        fileMeta: {
          cameraName: 'testCam',
          file: {
            name: `test_file_${index}`,
            ext: 'jpg',
          },
        },
      });
    }
    return dbConnect
      .dbCreate()
      .then(() => {
        console.log('tables created');
        return;
      })
      .then(() => {
        return dbConnect.start().then(() => {
          console.log('db connection OK.');
          let { camEvents, pendingList } = dbConnect.sequelize.models;
          PendingList = pendingList;
          CamEvents = camEvents;
          const addCamEvents = CamEvents.bulkCreate(mockEventList);
          const addPendingRequests = PendingList.bulkCreate(mockPendingList);
          return Promise.all([addCamEvents, addPendingRequests])
            .then((res) => {
              expect(res[0].length).to.equal(10);
              expect(res[1].length).to.equal(10);
            })
            .catch((err) => {
              console.log(err);
            });
        });
      });
  });

  // describe('Test jsonReSender if API error', () => {
  //   let nockScope;
  //   before(() => {
  //     // const responseOK = {
  //     //   req: 'q1w2e3r4t5y6u7i8o9p0',
  //     //   datetime: new Date(),
  //     //   status: 'OK',
  //     // };
  //     // nockScope = nock(process.env.API_SERVER)
  //     //   .persist()
  //     //   .post('/CollectMoveVehicles/ReceiveMovementHarpoon')
  //     //   // .reply(200, responseOK));
  //     //   .reply(500);
  //   });

  //   it('test with API down', (done) => {
  //     PendingList.findAndCountAll({}).then((res) => {
  //       expect(res.count).to.equal(11);
  //       done();
  //     });
  //   });

  //   after(() => {
  //     // nockScope.persist(false);
  //   });
  // });

  describe('Test jsonReSender if API OK', () => {
    before(() => {
      watcher.startWatch();
      const responseOK = {
        req: 'q1w2e3r4t5y6u7i8o9p0',
        datetime: new Date(),
        status: 'OK',
      };
      // return nock(process.env.API_SERVER)
      //   .persist()
      //   .post('/CollectMoveVehicles/ReceiveMovementHarpoon')
      //   .reply(200, responseOK);
    });

    it('test with API down', (done) => {
      PendingList.findAndCountAll({}).then((res) => {
        expect(res.count).to.equal(11);
        // watcher.stopWatch();
        done();
      });
    });

    after(() => {
      // nockScope.persist(false);
    });
  });

  after(() => {});
});
