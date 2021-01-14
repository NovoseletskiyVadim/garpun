const expect = require('chai').expect;
const alertScheduler = require('./../../utils/telegBot/rejectApiAlertScheduler');
let data = {
  deliveredAlerts: [],
  lastCalc: 0,
};

describe('test scheduler', function () {
  it('9 events should not sent', function () {
    expect(alertScheduler(9, data)).to.be.false;
    expect(data.deliveredAlerts).to.deep.equal([]);
  });
  it('10 events should sent', function () {
    expect(alertScheduler(10, data)).to.be.true;
    expect(data.deliveredAlerts).to.deep.equal([10]);
  });
  it('100 events should sent', function () {
    expect(alertScheduler(100, data)).to.be.true;
    expect(data.deliveredAlerts).to.deep.equal([10, 100]);
  });

  it('2 events should sent', function () {
    expect(alertScheduler(2, data)).to.be.true;
    expect(data.deliveredAlerts).to.deep.equal([]);
  });

  it('1000 events should sent', function () {
    expect(alertScheduler(1000, data)).to.be.true;
    expect(data.deliveredAlerts).to.deep.equal([10, 100, 1000]);
  });
  it('1001 events should sent', function () {
    expect(alertScheduler(1000, data)).to.be.false;
    expect(data.deliveredAlerts).to.deep.equal([10, 100, 1000]);
  });
  it('999 events should sent', function () {
    expect(alertScheduler(999, data)).to.be.true;
    expect(data.deliveredAlerts).to.deep.equal([10, 100]);
  });
  it('19999 events should sent', function () {
    expect(alertScheduler(19999, data)).to.be.true;
    expect(data.deliveredAlerts).to.deep.equal([
      10,
      100,
      1000,
      2000,
      3000,
      4000,
      5000,
      6000,
      7000,
      8000,
      9000,
      10000,
      11000,
      12000,
      13000,
      14000,
      15000,
      16000,
      17000,
      18000,
      19000,
    ]);
  });
  it('0 events should sent', function () {
    expect(alertScheduler(0, data)).to.be.true;
    expect(data.deliveredAlerts).to.deep.equal([]);
  });
  it('2000 events should sent', function () {
    expect(alertScheduler(2000, data)).to.be.true;
    expect(data.deliveredAlerts).to.deep.equal([10, 100, 1000, 2000]);
  });
  // it('99 events should not sent', function () {
  //   expect(alertScheduler(99, deliveredAlerts, lastCalc)).to.be.false;
  //   expect(deliveredAlerts).to.deep.equal([10]);
  // });
  // it('100 events should sent', function () {
  //   expect(alertScheduler(100, deliveredAlerts, lastCalc)).to.be.true;
  //   expect(deliveredAlerts).to.deep.equal([10, 100]);
  // });
  // it('1000 events should sent', function () {
  //   expect(alertScheduler(1000, deliveredAlerts, lastCalc)).to.be.true;
  //   expect(deliveredAlerts).to.deep.equal([10, 100, 1000]);
  // });
  // it('10000 events should sent', function () {
  //   expect(alertScheduler(10000, deliveredAlerts, lastCalc)).to.be.true;
  //   expect(deliveredAlerts).to.deep.equal([10, 100, 1000, 10000]);
  // });
  // it('9999 events should sent', function () {
  //   expect(alertScheduler(9999, deliveredAlerts, lastCalc)).to.be.true;
  //   expect(deliveredAlerts).to.deep.equal([10, 100, 1000]);
  // });
  // it('9998 events should not sent', function () {
  //   expect(alertScheduler(9998, deliveredAlerts, lastCalc)).to.be.false;
  //   expect(deliveredAlerts).to.deep.equal([10, 100, 1000]);
  // });
  // it('10001 events should sent', function () {
  //   // add an assertion
  //   expect(alertScheduler(10001, deliveredAlerts, lastCalc)).to.be.true;
  //   expect(deliveredAlerts).to.deep.equal([10, 100, 1000, 10000]);
  // });
  // it('500 events should sent', function () {
  //   // add an assertion
  //   expect(alertScheduler(500, deliveredAlerts, lastCalc)).to.be.true;
  //   expect(deliveredAlerts).to.deep.equal([10, 100]);
  // });
  // it('1 events should sent', function () {
  //   // add an assertion
  //   expect(alertScheduler(1, deliveredAlerts, lastCalc)).to.be.true;
  //   expect(deliveredAlerts).to.deep.equal([]);
  // });
  // it('10 events should sent', function () {
  //   // add an assertion
  //   expect(alertScheduler(10, deliveredAlerts, lastCalc)).to.be.true;
  //   expect(deliveredAlerts).to.deep.equal([10]);
  // });
  // it('11 events should sent', function () {
  //   // add an assertion
  //   expect(alertScheduler(11, deliveredAlerts, lastCalc)).to.be.false;
  //   expect(deliveredAlerts).to.deep.equal([10]);
  // });

  // it('11 events should sent', function () {
  //   // add an assertion
  //   expect(alertScheduler(0, deliveredAlerts, lastCalc)).to.be.false;
  //   expect(deliveredAlerts).to.deep.equal([]);
  // });

  // it('555 events should sent', function () {
  //   // add an assertion
  //   expect(alertScheduler(555, deliveredAlerts, lastCalc)).to.be.true;
  //   expect(deliveredAlerts).to.deep.equal([10, 100]);
  // });
});
