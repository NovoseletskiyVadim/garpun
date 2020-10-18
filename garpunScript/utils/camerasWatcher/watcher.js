'use strict';
const ping = require('ping');
const moment = require('moment');
const { models } = require('./../../db/dbConnect').sequelize;
const { alarmSignal } = require('../harpoonBot');
const BOT_TIME_OUT_MSG = 5;
const TIMEOUT_TO_CHECK = process.env.TIME_TO_CHECK_CAMERAS;

const pingCfg = {
  //timeout: 10,
};

module.exports = () => {
  let workingCamList = [];

  const createMsg = (camera, typeMsg) => {
    const timeOff = `, OFFLINE ${moment(camera.startTimeInOffLine).fromNow(
      true
    )}`;
    switch (typeMsg) {
      case 'OFFLINE':
        return `CAMERA_IS_DEAD ${camera.ftpHomeDir}${timeOff} \xF0\x9F\x94\xB4`;
      case 'ONLINE':
        return `CAMERA ${camera.ftpHomeDir} ONLINE${
          camera.startTimeInOffLine > 0 ? timeOff : ''
        }\xE2\x9C\x85`;
      default:
        return '';
    }
  };

  const setPingTimeOut = (camera, timeOut) => {
    camera.ping = setTimeout(function () {
      ping.sys.probe(
        camera.cameraIP,
        (isAlive) => {
          let msg = '';
          if (!isAlive) {
            camera.timeOutBotAlert--;

            if (camera.statusNow !== 'OFF' || camera.startTimeInOffLine === 0) {
              camera.statusNow = 'OFF';
              camera.startTimeInOffLine =
                moment() - process.env.TIME_TO_CHECK_CAMERAS;
            }
            msg = createMsg(camera, 'OFFLINE');
            console.log('\x1b[31m%s\x1b[0m', msg);

            if (
              camera.timeOutBotAlert !== BOT_TIME_OUT_MSG &&
              camera.timeOutBotAlert % BOT_TIME_OUT_MSG === 0
            ) {
              alarmSignal(msg);
            }
          } else {
            if (camera.statusNow !== 'ON') {
              const msg = createMsg(camera, 'ONLINE');
              console.log('\x1b[32m%s\x1b[0m', msg);
              camera.statusNow = 'ON';
              camera.startTimeInOffLine = 0;
              alarmSignal(msg);
              camera.timeOutBotAlert = BOT_TIME_OUT_MSG;
            }
          }
        },
        pingCfg
      );
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
            cam.timeOutBotAlert = BOT_TIME_OUT_MSG;
            cam.startTimeInOffLine = 0;
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
          workingCamList[cameraIndex].timeOutBotAlert = BOT_TIME_OUT_MSG;
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
