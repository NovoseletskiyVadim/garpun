/* eslint-disable no-undef */
const { expect } = require('chai');
const nock = require('nock');
const moment = require('moment');
const { v4: uuidv4 } = require('uuid');

require('dotenv').config({ path: '../../.env' });
const RejectWatcher = require('../../utils/jsonResenderProcess/watcher');
const jsonResend = require('../../utils/jsonResenderProcess/resender');
const dbConnect = require('../../db/dbConnect');
const CamEvents = require('../../models/camEvent');
const PendingList = require('../../models/pendingList');

process.env.NODE_ENV = 'DEV';

const watcher = new RejectWatcher(jsonResend);

const responseOK = {
  req: 'q1w2e3r4t5y6u7i8o9p0',
  datetime: new Date(),
  status: 'OK',
};

describe('Test jsonReSender test', () => {
  before(async () => {
    const mockEventList = [];
    for (let index = 0; index < 10; index += 1) {
      const uuid = uuidv4();
      mockEventList.push({
        uuid,
        time: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
        license_plate_number: 'NUMBER',
        camera: 'testCam',
        apiResponse: '',
        fileName: 'test_file',
        fileErrors: '',
      });
    }

    try {
      await dbConnect.dbTablesCreate();
      const addCamEvents = await CamEvents.bulkCreate(mockEventList, {
        validate: true,
      });
      const mockPendingList = addCamEvents.map((event, index) => ({
        status: 'API_ERROR',
        data: '',
        dbID: event.id,
        fileMeta: {
          cameraName: 'testCam',
          file: {
            name: `test_file_${index}`,
            ext: 'jpg',
          },
        },
      }));
      const addPendingRequests = await PendingList.bulkCreate(mockPendingList);
      expect(addCamEvents.length).to.equal(10);
      expect(addPendingRequests.length).to.equal(10);
    } catch (error) {
      console.error(error);
    }
    return true;
  });

  describe('Test jsonReSender if API error', () => {
    it('All requests rejected API ECONNREFUSED', async () => {
      const result = await jsonResend(10);
      const { count, sentList } = result;
      expect(count).to.equal(10);
      expect(sentList.length).to.equal(10);
      const calcPendingReq = await PendingList.findAndCountAll();
      expect(calcPendingReq.count).to.equal(10);
      const events = await CamEvents.findAll();
      expect(events.length).to.equal(10);
      events.forEach((event) => {
        expect(event.uploaded).to.be.false;
      });
      return true;
    });

    it('All requests rejected API statusCode 500', async () => {
      nock('http://localhost:3000')
        .post('/CollectMoveVehicles/ReceiveMovementHarpoon')
        .times(10)
        .reply(500);
      const result = await jsonResend(10);
      const { count, sentList } = result;
      expect(count).to.equal(10);
      expect(sentList.length).to.equal(10);
      const calcPendingReq = await PendingList.findAndCountAll();
      expect(calcPendingReq.count).to.equal(10);
      const events = await CamEvents.findAll();
      expect(events.length).to.equal(10);
      events.forEach((event) => {
        expect(event.uploaded).to.be.false;
      });
      return true;
    });
  });

  describe('Test jsonReSender if API OK', () => {
    it('All requests ok', async () => {
      nock('http://localhost:3000')
        .post('/CollectMoveVehicles/ReceiveMovementHarpoon')
        .times(10)
        .reply(200, responseOK);

      const result = await jsonResend(10);
      const { count, sentList } = result;
      expect(count).to.equal(10);
      expect(sentList.length).to.equal(10);
      const calcPendingReq = await PendingList.findAndCountAll();
      expect(calcPendingReq.count).to.equal(0);
      const events = await CamEvents.findAll();
      expect(events.length).to.equal(10);
      events.forEach((event) => {
        expect(event.uploaded).to.be.true;
      });
      return true;
    });
  });

  describe('Test with watcher test', () => {
    before(async () => {
      watcher.startWatch();
      const mockEventList = [];
      for (let index = 0; index < 10; index += 1) {
        const uuid = uuidv4();
        mockEventList.push({
          uuid,
          time: moment().format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
          license_plate_number: 'NUMBER',
          camera: 'testCam',
          apiResponse: '',
          fileName: 'test_file',
          fileErrors: '',
        });
      }

      try {
        await dbConnect.dbTablesCreate();
        const addCamEvents = await CamEvents.bulkCreate(mockEventList, {
          validate: true,
        });
        const mockPendingList = addCamEvents.map((event, index) => ({
          status: 'API_ERROR',
          data: '',
          dbID: event.id,
          fileMeta: {
            cameraName: 'testCam',
            file: {
              name: `test_file_${index}`,
              ext: 'jpg',
            },
          },
        }));
        const addPendingRequests = await PendingList.bulkCreate(
          mockPendingList
        );
        expect(addCamEvents.length).to.equal(10);
        expect(addPendingRequests.length).to.equal(10);
      } catch (error) {
        console.error(error);
      }
      return true;
    });

    it('Test watcher when API of', () => {
      nock('http://localhost:3000')
        .post('/CollectMoveVehicles/ReceiveMovementHarpoon')
        .times(10)
        .reply(200, responseOK);
      console.log('df');
    });

    after(() => {
      watcher.stopWatch();
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

  // describe('Test jsonReSender if API OK', () => {
  //   before(() => {
  //     watcher.startWatch();
  //     const responseOK = {
  //       req: 'q1w2e3r4t5y6u7i8o9p0',
  //       datetime: new Date(),
  //       status: 'OK',
  //     };
  //     // return nock(process.env.API_SERVER)
  //     //   .persist()
  //     //   .post('/CollectMoveVehicles/ReceiveMovementHarpoon')
  //     //   .reply(200, responseOK);
  //   });

  //   it('test with API down', (done) => {
  //     PendingList.findAndCountAll({}).then((res) => {
  //       expect(res.count).to.equal(11);
  //       // watcher.stopWatch();
  //       done();
  //     });
  //   });

  //   after(() => {
  //     // nockScope.persist(false);
  //   });
  // });

  // after(() => {});
});
