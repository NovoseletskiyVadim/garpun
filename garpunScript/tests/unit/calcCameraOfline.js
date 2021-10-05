const moment = require('moment');

const botIcons = { CAMERA_OFFLINE_WARNING: '\xE2\x81\x89' };

const lastTimeEvent = {
    lastEvent: '2021-10-02T20:14:58.965Z',
};

let lastEventMsg = 'Not active';
if (lastTimeEvent && lastTimeEvent.lastEvent) {
    const lastEventTime = moment(lastTimeEvent.lastEvent).add(
        this.timeOffset,
        'minutes'
    );
    const timeNow = moment();
    lastEventMsg = moment(lastEventTime).format('YYYY-MM-DD hh:mm:ss');
    if (((timeNow - lastEventTime) / 1000).toFixed() > '86400') {
        lastEventMsg += ` ${botIcons.CAMERA_OFFLINE_WARNING}`;
    }
}

console.log(lastEventMsg);
