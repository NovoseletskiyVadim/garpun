'use strict';
const ping = require('ping');
const moment = require('moment');
const { models } = require('./../../db/dbConnect').sequelize;
const { alarmSignal } = require('../harpoonBot');
const BOT_TIME_OUT = 5;
const TIMEOUT_TO_CHECK = process.env.TIME_TO_CHECK_CAMERAS;

module.exports = () => {
  let workingCamList = [];

  const createMsg = (camera, typeMsg) => {
    switch (typeMsg) {
      case 'OFFLINE':
        return `CAMERA_IS_DEAD ${camera.ftpHomeDir} \xF0\x9F\x94\xB4`;

      case 'ONLINE':
        return `CAMERA ${camera.ftpHomeDir} ONLINE, TIME_IN_OFFLINE ${moment(
          Date.now() - camera.timeInOfLine
        ).format('mm:ss')} \xE2\x9C\x85`;
      default:
        return '';
    }
  };

  const setPingTimeOut = (camera, timeOut) => {
    camera.ping = setTimeout(function () {
      ping.sys.probe(camera.cameraIP, (isAlive) => {
        let msg = '';
        if (!isAlive) {
          msg = createMsg(camera, 'OFFLINE');
          console.log('\x1b[31m%s\x1b[0m', msg);
          if (camera.statusNow !== 'OFF') {
            camera.statusNow = 'OFF';
          }
          if (camera.timeOutBotAlert === 5) {
            camera.timeInOfLine = Date.now();
          }
          camera.timeOutBotAlert--;
          if (camera.timeOutBotAlert === 0) {
            alarmSignal(msg);
          }
        } else {
          if (camera.statusNow !== 'ON') {
            const msg = createMsg(camera, 'ONLINE');
            console.log('\x1b[32m%s\x1b[0m', msg);
            camera.statusNow = 'ON';
            alarmSignal(msg);
            camera.timeOutBotAlert = BOT_TIME_OUT;
          }
        }
      });
      setPingTimeOut(camera, timeOut);
    }, timeOut);
  };
  return {
    startWatch: () => {
      models.cameras
        .findAll({ where: { isOnLine: true }, raw: true })
        .then((camerasList) => {
          let workingCam = '';
          workingCamList = camerasList.map((cam) => {
            workingCam += ` ${cam.ftpHomeDir}:${cam.cameraIP}`;
            setPingTimeOut(cam, TIMEOUT_TO_CHECK);
            cam.statusNow = 'OFF';
            cam.timeOutBotAlert = 5;
            cam.timeInOfLine = Date.now();
            return cam;
          });
          console.log(`WORKING_CAMERAS: ${workingCam}`);
        });
    },

    cameraAction: (cameraName) => {
      const cameraIndex = workingCamList.findIndex((cam) => {
        if (cam.ftpHomeDir === cameraName) {
          return true;
        }
      });
      if (cameraIndex >= 0) {
        if (workingCamList[cameraIndex].statusNow !== 'ON') {
          const msg = createMsg(workingCamList[cameraIndex], 'ONLINE');
          console.log('\x1b[32m%s\x1b[0m', msg);
          workingCamList[cameraIndex].statusNow = 'ON';
          alarmSignal(msg);
          workingCamList[cameraIndex].timeOutBotAlert = BOT_TIME_OUT;
        }
        clearTimeout(workingCamList[cameraIndex].ping);
        setPingTimeOut(workingCamList[cameraIndex], TIMEOUT_TO_CHECK);
      }
    },

    pingByName: (cameraName) => {
      const cameraIndex = workingCamList.findIndex((cam) => {
        if (cam.ftpHomeDir === cameraName) {
          return true;
        }
      });
      if (cameraIndex < 0) {
        return 'WRONG_CAMERA_NAME';
      } else {
        ping.sys.probe(workingCamList[cameraIndex].cameraIP, (isAlive) => {
          if (isAlive) {
            return `${cameraName} ONLINE`;
          } else {
            return `${cameraName} OFFLINE`;
          }
        });
      }
    },
  };
};
