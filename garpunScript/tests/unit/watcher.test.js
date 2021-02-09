const expect = require('chai').expect;
const moment = require('moment');

const createMsg = (camera, typeMsg) => {
  const timeOff = moment(camera.startTimeInOffLine).fromNow(true);
  console.log(moment('2020-10-18T13:37:24+03:00').fromNow(true));

  switch (typeMsg) {
    case 'OFFLINE':
      return `CAMERA_IS_DEAD ${camera.ftpHomeDir}, TIME_IN_OFFLINE ${timeOff} \xF0\x9F\x94\xB4`;
    case 'ONLINE':
      return `CAMERA ${camera.ftpHomeDir} ONLINE ${
        camera.startTimeInOffLine > 0 ? `, TIME_IN_OFFLINE ${timeOff} ` : ''
      }\xE2\x9C\x85`;
    default:
      return '';
  }
};

describe('Test jsonSender ', function () {
  let camera = {};
  before(() => {
    camera.ftpHomeDir = 'test_cam';
    camera.startTimeInOffLine = moment().subtract(11, 'minute');
    console.log(camera);
  });
  it('firs OFF message', () => {
    expect(createMsg(camera, 'OFFLINE')).equal(
      `CAMERA_IS_DEAD test_cam, TIME_IN_OFFLINE 01:00} \xF0\x9F\x94\xB4`
    );
  });

  // before(() => {
  //   camera.ftpHomeDir = 'test_cam1';
  //   camera.startTimeInOffLine = moment().subtract(1, 'hour');
  //   console.log(camera);
  // });
  it('1 hour in offline', () => {
    expect(createMsg(camera, 'OFFLINE')).equal(
      `CAMERA_IS_DEAD test_cam, TIME_IN_OFFLINE 01:00} \xF0\x9F\x94\xB4`
    );
  });
});
