const getFileMeta = require('../../utils/getFileMeta');
var expect = require('chai').expect;

describe('getFileMeta test', function () {
  it('should work', function () {
    const result = getFileMeta(
      'c:\\media_test\\20200821153229331_CA5402AO_VEHICLE_DETECTION.jpg'
    );
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
      eventDate: '2020-08-21T15:32:29.331+03:00',
      cameraName: 'media_test',
      plateNumber: 'CA5402AO',
      isValid: true,
    });
    expect(result.notPassed).to.be.an.instanceof(Array).to.be.empty;
    expect(result.file).to.include({
      dir: 'c:\\media_test',
      name: '20200821153229331_CA5402AO_VEHICLE_DETECTION',
      ext: '.jpg',
      fullPath:
        'c:\\media_test\\20200821153229331_CA5402AO_VEHICLE_DETECTION.jpg',
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

  it('should not work - wrong event type', function () {
    const result = getFileMeta('c:\\media_test\\20200821153229331_CA5402AO');
    expect(result).to.be.an('object');
    expect(result.notPassed)
      .to.be.an.instanceof(Array)
      .deep.equal(['EVENT_NAME']);
  });

  it('should not work - wrong file name', function () {
    const result = getFileMeta('c:\\media_test\\qwerty');
    expect(result).to.be.an('object');
    expect(result.notPassed)
      .to.be.an.instanceof(Array)
      .deep.equal(['EVENT_NAME', 'PLATE_NUMBER', 'TIME_STAMP']);
  });
});
