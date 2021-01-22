const expect = require('chai').expect;
const alertScheduler = require('./../../utils/telegBot/jsonReSenderAlertScheduler.js');
let alertHistory = {
  deliveredAlerts: [],
  lastCount: 0,
};

describe('test json ReSender Alert Scheduler', function () {
  it('9 events lastCount: 0 should not sent', function () {
    const result = alertScheduler(9, alertHistory);
    expect(result).to.deep.equal({
      shouldSent: false,
      deliveredAlerts: [],
    });
  });
  it('10 events lastCount: 0 should sent', function () {
    const result = alertScheduler(10, alertHistory);
    expect(result).to.deep.equal({
      shouldSent: true,
      deliveredAlerts: [10],
    });
  });
  it('100 events lastCount: 0 should sent', function () {
    const result = alertScheduler(100, alertHistory);
    expect(result).to.deep.equal({
      shouldSent: true,
      deliveredAlerts: [10, 100],
    });
  });

  it('2 events lastCount: 11 should sent', function () {
    alertHistory = {
      deliveredAlerts: [10],
      lastCount: 11,
    };

    const result = alertScheduler(2, alertHistory);
    expect(result).to.deep.equal({
      shouldSent: true,
      deliveredAlerts: [],
    });
  });

  it('1000 events lastCount: 11 should sent', function () {
    alertHistory = {
      deliveredAlerts: [],
      lastCount: 2,
    };
    const result = alertScheduler(1000, alertHistory);
    expect(result).to.deep.equal({
      shouldSent: true,
      deliveredAlerts: [10, 100, 1000],
    });
  });
  it('1001 events lastCount: 1000 after 1000 should not sent', function () {
    alertHistory = {
      lastCount: 1000,
      deliveredAlerts: [10, 100, 1000],
    };
    const result = alertScheduler(1001, alertHistory);
    expect(result).to.deep.equal({
      shouldSent: false,
      deliveredAlerts: [10, 100, 1000],
    });
  });
  it('999 events lastCount:1001  should sent', function () {
    alertHistory = {
      lastCount: 1001,
      deliveredAlerts: [10, 100, 1000],
    };
    const result = alertScheduler(999, alertHistory);
    expect(result).to.deep.equal({
      shouldSent: true,
      deliveredAlerts: [10, 100],
    });
  });
  it('19999 events lastCount:1001 should sent', function () {
    const result = alertScheduler(19999, alertHistory);
    expect(result).to.deep.equal({
      shouldSent: true,
      deliveredAlerts: [
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
      ],
    });
  });
  it('0 events lastCount:1001  should sent', function () {
    alertHistory = {
      lastCount: 1001,
      deliveredAlerts: [10, 100, 1000],
    };
    const result = alertScheduler(0, alertHistory);
    expect(result).to.deep.equal({
      shouldSent: true,
      deliveredAlerts: [],
    });
  });
});
