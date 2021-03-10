const alertScheduler = (eventCalc, alertsHistory) => {
  const { lastCount } = alertsHistory;
  let { deliveredAlerts, isBigQueue } = alertsHistory;
  const isGrown = lastCount < eventCalc ? true : false;
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
    if (rangeOneHundred > 0) {
      isBigQueue = true;
      shouldSent = checkIsDelivered(100);
    }
    if (rangeThousand > 0) {
      isBigQueue = true;
      for (let index = 1; index <= rangeThousand; index++) {
        shouldSent = checkIsDelivered(index * 1000);
      }
    }
  } else if (lastDelivered > eventCalc && eventCalc !== 0) {
    const found = deliveredAlerts.findIndex((element) => element > eventCalc);
    deliveredAlerts.splice(found);
    shouldSent = true;
  } else if (eventCalc === 0) {
    if (isBigQueue) {
      shouldSent = true;
    }
    isBigQueue = false;
    deliveredAlerts = [];
  } else {
    shouldSent = false;
  }
  return { shouldSent, deliveredAlerts, isBigQueue };
};

module.exports = alertScheduler;
