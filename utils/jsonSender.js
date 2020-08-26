const logger = require('./logger');
module.exports = (eventData) => {
  const { cameraName, fileName } = eventData;
  if (fileName) {
    const [time, plateNumber, ...rest] = fileName.split('_');
    let eventName = rest.join('_');
    if (eventName === `VEHICLE_DETECTION`) {
      console.log(time, cameraName, plateNumber, eventName);
      logger.saveDetectEvent({ time, fileName, plateNumber, eventName });
    } else {
      logger.saveErrorEvent({ message: 'wrong event name' + ' ' + eventName });
      console.log('wrong event name');
    }
  }
};
