const { Op } = require('sequelize');
const moment = require('moment');

require('dotenv').config({ path: './../../.env' });
const logToFile = require('../logger/logToFile');

const dbConnect = require('../../db/dbConnect');
const Cameras = require('../../models/cameras');
const CamEvents = require('../../models/camEvent');
const Users = require('../../models/users');
const { alarmSignal } = require('../telegBot/harpoonBot');

const today = moment().format('YYYY-MM-DD');
const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');

const timeZone = moment.tz.zonesForCountry('UA', true);
const timeOffset = Math.abs(timeZone[0].offset);

function eventTimeRange(reduceResult, camEvent) {
  const eventTime = moment(camEvent.time, 'YYYY-MM-DD hh:mm:ss.sss').add(
    timeOffset,
    'minutes'
  );
  const apiRespObject = JSON.parse(camEvent.apiResponse);
  const apiRespTime = moment(apiRespObject.datetime);
  const delayTime = (apiRespTime - eventTime) / 60000;
  if (delayTime >= 60) {
    reduceResult['60+'] += 1;
  } else if (delayTime >= 30) {
    reduceResult['30-60'] += 1;
  } else if (delayTime >= 15) {
    reduceResult['15-30'] += 1;
  } else if (delayTime >= 2) {
    reduceResult['2-15'] += 1;
  } else if (delayTime < 2 && delayTime > 0) {
    reduceResult['0-2'] += 1;
  } else {
    reduceResult['<0'] += 1;
  }
  return reduceResult;
}
dbConnect.start().then(() => {
  console.log('db connection OK.');
  return Cameras.findAll({
    raw: true,
  }).then((camerasList) => {
    const dbQueries = camerasList.map((camera) => {
      return CamEvents.findAll({
        raw: true,
        where: {
          camera: camera.ftpHomeDir,
          createdAt: {
            [Op.between]: [
              moment(`${yesterday} 09:00:00`).local(),
              moment(`${today} 08:59:59`).local(),
            ],
          },
        },
      }).then((eventsList) => {
        let msg = `${camera.ftpHomeDir} - Total events: ${eventsList.length}`;
        if (eventsList.length > 0) {
          const filtered = eventsList.reduce(eventTimeRange, {
            '<0': 0,
            '0-2': 0,
            '2-15': 0,
            '15-30': 0,
            '30-60': 0,
            '60+': 0,
          });
          let filteredString = '\nAPI response in minutes:\n';
          Object.keys(filtered).forEach((key) => {
            filteredString += `${key}: ${filtered[key]} \n`;
          });
          msg += filteredString;
        } else {
          msg += '\n';
        }
        return msg;
      });
    });
    Promise.all(dbQueries).then((result) => {
      let textMsg = '<b>Garpun daily stat as of 9:00AM</b> \n ';
      textMsg += result.join('\n');
      console.log(textMsg);
      alarmSignal(textMsg);
    });
  });
});
