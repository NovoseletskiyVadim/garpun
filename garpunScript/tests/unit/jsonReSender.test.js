const expect = require('chai').expect;
const nock = require('nock');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config({ path: '../../.env' });
const jsonResend = require('../../utils/jsonResenderProcess/resender');
const dbConnect = require('../../db/dbConnect');
process.env.NODE_ENV = 'DEV';

let limit = 10;
const responseOK = {
  req: 'q1w2e3r4t5y6u7i8o9p0',
  datetime: new Date(),
  status: 'OK',
};
let nockScope;
let PendingList;
let CamEvents;

describe('Test resender', () => {
  before(() => {
    let mockEventList = [];
    let mockPendingList = [];
    for (let index = 0; index < 10; index++) {
      const uuid = uuidv4();
      // mockEventList.push({
      //   uuid,
      //   time: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      //   license_plate_number: 'NUMBER',
      //   camera: 'testCam',
      //   apiResponse: '',
      //   fileName: '',
      // });
      mockPendingList.push({
        status: 500,
        data: '',
        dbID: uuid,
        fileMeta: '',
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

  describe('Resend request API respond with status 500 ', () => {
    before(() => {
      nockScope = nock(process.env.API_SERVER)
        .persist()
        .post('/CollectMoveVehicles/ReceiveMovementHarpoon')
        .reply(500);
    });
    it('try send', (done) => {
      jsonResend(limit)
        .then((result) => {
          expect(result.count).to.equal(10);
          expect(result).to.have.all.keys('count', 'apiError');
          done();
        })
        .catch((err) => {
          console.log(err);
          done();
        });
    });
    after(() => {
      nock.cleanAll();
    });
  });
  describe('Resend request to API should be res ok ', () => {
    before(() => {
      nockScope = nock(process.env.API_SERVER)
        .persist()
        .post('/CollectMoveVehicles/ReceiveMovementHarpoon')
        .reply(200, responseOK);
    });
    it('PendingList in db should be 0 and return object with keys count: 10, sentList: [] of objects sent events', (done) => {
      jsonResend(limit)
        .then((result) => {
          expect(result).to.have.all.keys('count', 'sentList');
          expect(result.count).to.equal(10);
          expect(result.sentList.length).to.equal(10);
          result.sentList.forEach((item) => {
            expect(item.uploaded).to.be.true;
            expect(item.apiResponse).to.have.all.keys(
              'req',
              'datetime',
              'status'
            );
          });
          PendingList.count().then((num) => {
            expect(num).to.equal(0);
            done();
          });
        })
        .catch((err) => {
          console.log(err);
          done();
        });
    });
    after(() => {
      nockScope.isDone();
    });
  });
  describe('Resend request if PendingList  0, should be returned object with keys count = 0 ', () => {
    it('try send', (done) => {
      jsonResend(limit)
        .then((result) => {
          expect(result.count).to.equal(0);
          expect(result).to.have.deep.keys('count');
          done();
        })
        .catch((err) => {
          console.log(err);
          done();
        });
    });
  });
});
