const { Op } = require('sequelize');
const moment = require('moment');

require('dotenv').config({ path: './../../.env' });
const logToFile = require('../logger/logToFile');

const dbConnect = require('../../db/dbConnect');
const Cameras = require('../../models/cameras');
const CamEvents = require('../../models/camEvent');
const { alarmSignal } = require('../telegBot/harpoonBot');

const today = moment().format('YYYY-MM-DD');
const yesterday = moment().subtract(2, 'days').format('YYYY-MM-DD');

const timeZone = moment.tz.zonesForCountry('UA', true);
const timeOffset = Math.abs(timeZone[0].offset);

const reportRowsNames = {
  notUploaded: 'NOT_UPLOADED',
  fileSize: 'FILE_SIZE',
  fileType: 'FILE_TYPE',
  eventName: 'EVENT_NAME',
  plateNumber: 'PLATE_NUMBER',
  timeStamp: 'TIME_STAMP',
  camTimeSync: 'CAM_TIME_SYNC',
  cameraInfo: 'CAMERA_INFO',
  apiRejected: 'API_REJECT',
};

function eventTimeRange(reduceResult, camEvent) {
  if (camEvent.uploaded) {
    const eventTime = moment(camEvent.time, 'YYYY-MM-DD hh:mm:ss.sss').add(
      timeOffset,
      'minutes'
    );
    const apiRespObject = JSON.parse(camEvent.apiResponse);
    const apiRespTime = moment(apiRespObject.datetime);
    const delayTime = (apiRespTime - eventTime) / 60000;
    if (isNaN(delayTime)) {
      console.log('delayTime');
    }
    if (delayTime >= 60) {
      reduceResult['more 60'] += 1;
    } else if (delayTime >= 30) {
      reduceResult['30-60'] += 1;
    } else if (delayTime >= 15) {
      reduceResult['15-30'] += 1;
    } else if (delayTime >= 2) {
      reduceResult['2-15'] += 1;
    } else if (delayTime < 2 && delayTime > 0) {
      reduceResult['0-2'] += 1;
    } else {
      reduceResult['less 0'] += 1;
    }
  } else {
    reduceResult[reportRowsNames.notUploaded] += 1;
    if (camEvent.apiResponse) {
      reduceResult[reportRowsNames.apiRejected] += 1;
    }
    const fileErrorsList = camEvent.fileErrors.split(',');
    fileErrorsList.forEach((item) => {
      if (item) {
        reduceResult[item] += 1;
      }
    });
  }
  return reduceResult;
}
dbConnect.connectionTest().then(() => {
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
              moment(`${today} 20:59:59`).local(),
            ],
          },
        },
      }).then((eventsList) => {
        let cameraStat = {
          countEvents: eventsList.length,
          stsMsg: `${camera.ftpHomeDir} - Total events: ${eventsList.length}`,
        };
        if (eventsList.length > 0) {
          const filtered = eventsList.reduce(eventTimeRange, {
            'less 0': 0,
            '0-2': 0,
            '2-15': 0,
            '15-30': 0,
            '30-60': 0,
            'more 60': 0,
            [reportRowsNames.notUploaded]: 0,
            [reportRowsNames.fileSize]: 0,
            [reportRowsNames.apiRejected]: 0,
            [reportRowsNames.timeStamp]: 0,
            [reportRowsNames.camTimeSync]: 0,
            [reportRowsNames.plateNumber]: 0,
            [reportRowsNames.fileType]: 0,
            [reportRowsNames.cameraInfo]: 0,
          });
          let filteredString = '\nAPI response in minutes:\n';
          Object.keys(filtered).forEach((key) => {
            filteredString += `${key}: ${filtered[key]} \n`;
          });
          cameraStat.stsMsg += filteredString;
        } else {
          cameraStat.stsMsg += '\n';
        }
        return cameraStat;
      });
    });
    Promise.all(dbQueries).then((result) => {
      let textMsg = 'Garpun daily stat as of 9:00AM \n';
      let totalCount = 0;
      let fullStatMsg = '';
      result.forEach((item) => {
        totalCount += item.countEvents;
        fullStatMsg += `${item.stsMsg} \n`;
      });
      textMsg += `Total events count ${totalCount} \n`;
      textMsg += '______________________________________\n';
      textMsg += fullStatMsg;
      console.log(textMsg);
      alarmSignal(textMsg);
    });
  });
});
