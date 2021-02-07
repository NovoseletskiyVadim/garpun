const expect = require('chai').expect;
const moment = require('moment');

const getFileMeta = require('../../utils/fileExplorer/getFileMeta');

describe('getFileMeta test', function () {
  it('File should pass check', () => {
    const timeNow = moment();
    const fileName = `${timeNow.format(
      'YYYYMMDDHHmmssSSS'
    )}_CA5402AO_VEHICLE_DETECTION`;
    const result = getFileMeta(`c:\\media_test\\${fileName}.jpg`);
    expect(result)
      .to.be.an('object')
      .that.has.all.keys(
        'isValid',
        'notPassed',
        'uuid',
        'eventDate',
        'cameraName',
        'plateNumber',
        'file'
      );
    expect(result).to.include({
      eventDate: timeNow.format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
      cameraName: 'media_test',
      plateNumber: 'CA5402AO',
      isValid: true,
    });
    expect(result.notPassed).to.be.an.instanceof(Array).to.be.empty;
    expect(result.file).to.include({
      dir: 'c:\\media_test',
      name: fileName,
      ext: '.jpg',
      fullPath: `c:\\media_test\\${fileName}.jpg`,
    });
  });

  it('should not work - wrong date', function () {
    const result = getFileMeta(
      'c:\\media_test\\QQQQQQ_a1200xrg_VEHICLE_DETECTION.jpg'
    );
    expect(result)
      .to.be.an('object')
      .that.has.all.keys(
        'isValid',
        'notPassed',
        'uuid',
        'file',
        'cameraName',
        'plateNumber'
      )
      .to.include({
        cameraName: 'media_test',
        plateNumber: 'a1200xrg',
        isValid: false,
      });
    expect(result.notPassed)
      .to.be.an.instanceof(Array)
      .deep.equal(['TIME_STAMP']);
    expect(result.file).to.include({
      dir: 'c:\\media_test',
      name: 'QQQQQQ_a1200xrg_VEHICLE_DETECTION',
      ext: '.jpg',
      fullPath: 'c:\\media_test\\QQQQQQ_a1200xrg_VEHICLE_DETECTION.jpg',
    });
  });

  it('should not work - wrong plateNumber <4', function () {
    const result = getFileMeta(
      'c:\\media_test\\QQQQQQ_CA5_VEHICLE_DETECTION.jpg'
    );
    expect(result).to.be.an('object');
    expect(result.notPassed)
      .to.be.an.instanceof(Array)
      .deep.equal(['PLATE_NUMBER', 'TIME_STAMP']);
  });

  it('File should pass check with cam time error', function () {
    const result = getFileMeta(
      'c:\\media_test\\20201015082313898_CA5030ER_VEHICLE_DETECTION.jpg'
    );
    expect(result).to.be.an('object');
    expect(result.notPassed)
      .to.be.an.instanceof(Array)
      .deep.equal(['CAM_TIME_SYNC']);
    expect(result.isValid).to.be.true;
  });

  it('should not work - wrong event type', function () {
    const timeNow = moment();
    const fileName = `${timeNow.format('YYYYMMDDHHmmssSSS')}_CA5402AO`;
    const result = getFileMeta(`c:\\media_test\\${fileName}`);
    expect(result).to.be.an('object');
    expect(result.notPassed)
      .to.be.an.instanceof(Array)
      .deep.equal(['EVENT_NAME']);
  });

  it('should not work - wrong file name', function () {
    const result = getFileMeta('c:\\media_test\\qwerty');
    expect(result).to.be.an('object');
    expect(result.isValid).to.be.false;
    expect(result.notPassed)
      .to.be.an.instanceof(Array)
      .deep.equal(['EVENT_NAME', 'PLATE_NUMBER', 'TIME_STAMP']);
  });
});
