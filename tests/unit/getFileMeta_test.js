const getFileMeta = require('./../../utils/getFileMeta');
var expect = require('chai').expect;

describe('getFileMeta test', function () {
  it('should work', function () {
    const result = getFileMeta(
      'c:\\media_test\\20200821153229331_CA5402AO_VEHICLE_DETECTION.jpg'
    );
    expect(result)
      .to.be.an('object')
      .that.has.all.keys(
        'uuid',
        'eventDate',
        'cameraName',
        'plateNumber',
        'file'
      );
    expect(result).to.include({
      eventDate: '2020-08-21T15:32:29+03:00',
      cameraName: 'media_test',
      plateNumber: 'CA5402AO',
    });
    expect(result.file).to.include({
      dir: 'c:\\media_test',
      name: '20200821153229331_CA5402AO_VEHICLE_DETECTION',
      ext: '.jpg',
      fullPath:
        'c:\\media_test\\20200821153229331_CA5402AO_VEHICLE_DETECTION.jpg',
    });
  });
  it('should not work - wrong date', function () {
    expect(getFileMeta('c:\\media_test\\QQQQQQ_CA5402AO_VEHICLE_DETECTION.jpg'))
      .to.be.false;
  });
  it('should not work - wrong plateNumber <4', function () {
    expect(getFileMeta('c:\\media_test\\QQQQQQ_CA5_VEHICLE_DETECTION.jpg')).to
      .be.false;
  });

  it('should not work - wrong event type', function () {
    expect(getFileMeta('c:\\media_test\\20200821153229331_CA5402AO')).to.be
      .false;
  });

  it('should not work - wrong file name', function () {
    expect(getFileMeta('c:\\media_test\\qwerty')).to.be.false;
  });
});
