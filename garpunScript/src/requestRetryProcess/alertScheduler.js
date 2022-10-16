const alertScheduler = (eventCalc, alertsHistory) => {
    const lastCount = alertsHistory.lastCount || 0;
    let deliveredAlerts = Array.isArray(alertsHistory.deliveredAlerts)
        ? [...alertsHistory.deliveredAlerts]
        : [];
    let { isBigQueue } = alertsHistory;
    const isGrown = lastCount < eventCalc && true;
    const rangeOneHundred = Math.floor(eventCalc / 100);
    const rangeThousand = Math.floor(eventCalc / 1000);

    const checkIsDelivered = (num) => {
        if (!deliveredAlerts.includes(num)) {
            deliveredAlerts.push(num);
            return true;
        }
        return false;
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
            for (let index = 1; index <= rangeThousand; index += 1) {
                shouldSent = checkIsDelivered(index * 1000);
            }
        }
    } else if (lastDelivered > eventCalc && eventCalc !== 0) {
        const found = deliveredAlerts.findIndex(
            (element) => element > eventCalc
        );
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
    return {
        isGrown, shouldSent, deliveredAlerts, isBigQueue
    };
};

module.exports = alertScheduler;
