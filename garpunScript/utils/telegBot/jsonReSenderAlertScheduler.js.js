const alertScheduler = (eventCalc, alertsHistory) => {
  const { lastCount, deliveredAlerts } = alertsHistory;
  const isGrown = lastCount < eventCalc && true;
  const rangeTen = Math.floor(eventCalc / 10);
  const rangeOneHundred = Math.floor(eventCalc / 100);
  const rangeThousand = Math.floor(eventCalc / 1000);

  const checkIsDelivered = (num) => {
    const index = deliveredAlerts.indexOf(num);
    if (index < 0) {
      deliveredAlerts.push(num);
      return true;
    } else {
      return false;
    }
  };

  const lastDelivered = deliveredAlerts[deliveredAlerts.length - 1];
  let shouldSent = false;
  if (isGrown) {
    if (rangeTen > 0) {
      shouldSent = checkIsDelivered(10);
    }
    if (rangeOneHundred > 0) {
      shouldSent = checkIsDelivered(100);
    }
    if (rangeThousand > 0) {
      for (let index = 1; index <= rangeThousand; index++) {
        shouldSent = checkIsDelivered(index * 1000);
      }
    }
    shouldSent;
  } else if (lastDelivered > eventCalc) {
    const found = deliveredAlerts.findIndex((element) => element > eventCalc);
    deliveredAlerts.splice(found);
    shouldSent = true;
  } else if (eventCalc === 0) {
    shouldSent = true;
  } else {
    shouldSent = false;
  }
  return { shouldSent, deliveredAlerts };
};
let alertHistory = {
  deliveredAlerts: [],
  lastCount: 0,
};

module.exports = alertScheduler;
