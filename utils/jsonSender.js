const logger = require('./logger');
module.exports = (eventMeta) => {
  if (eventMeta) {
    const [time, plateNumber, ...rest] = eventMeta.split('_');
    let eventName = rest.join('_');
    if (eventName === `VEHICLE_DETECTION`) {
      console.log(time, plateNumber, eventName);
      logger.saveDetectEvent({ time, plateNumber, eventName });
    } else {
      logger.saveErrorEvent({ message: 'wrong event name' + ' ' + eventName });
      console.log('wrong event name');
    }
  }
};
