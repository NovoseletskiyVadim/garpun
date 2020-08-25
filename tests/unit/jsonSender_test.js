const jsonSender = require('./../utils/jsonSender');
var expect = require('chai').expect;

describe('jsonSender', function () {
  it('should work', function () {
    expect(
      jsonSender('20200821153229331_CA5402AO_VEHICLE_DETECTION'),
      'to equal',
      ['before', 'before two']
    );
  });
  // it('should not work', function () {
  //   expect(jsonSender('202wer_CA5402AO_VEHICLE_DETECTION'), 'to equal', [
  //     'before',
  //     'before two',
  //   ]);
  // });
  // it('should not work', function () {
  //   expect(jsonSender('20200821153229331_CA5402AO'), 'to equal', [
  //     'before',
  //     'before two',
  //   ]);
  // });
});
