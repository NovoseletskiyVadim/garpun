const alertScheduler = (eventCalc, alertsHistory) => {
  const isGrown =
    (alertsHistory.lastCount < eventCalc || !alertsHistory.lastCount) && true;
  const rangeTen = Math.floor(eventCalc / 10);
  const rangeOneHundred = Math.floor(eventCalc / 100);
  const rangeThousand = Math.floor(eventCalc / 1000);

  const checkIsDelivered = (num) => {
    const index = alertsHistory.deliveredAlerts.indexOf(num);
    if (index < 0) {
      alertsHistory.deliveredAlerts.push(num);
      return true;
    } else {
      return false;
    }
  };

  const lastDelivered =
    alertsHistory.deliveredAlerts[alertsHistory.deliveredAlerts.length - 1];
  if (isGrown) {
    let shouldSent = false;
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
    return shouldSent;
  } else if (lastDelivered > eventCalc) {
    const found = alertsHistory.deliveredAlerts.findIndex(
      (element) => element > eventCalc
    );
    alertsHistory.deliveredAlerts.splice(found);
    return true;
  } else if (eventCalc === 0) {
    return true;
  } else {
    return false;
  }
};

module.exports = alertScheduler;
