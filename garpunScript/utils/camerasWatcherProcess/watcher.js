const ping = require('ping');
const moment = require('moment');

const Cameras = require('../../models/cameras');
const Logger = require('../logger/appLog');
const logTypes = require('../logger/logTypes');

module.exports = () => {
  const logger = Logger();
  let workingCamList = [];
  const TIMEOUT_TO_CHECK = process.env.TIME_TO_CHECK_CAMERAS;

  const setPingTimeOut = (camera, timeOut) => {
    camera.ping = setTimeout(() => {
      ping.sys.probe(camera.cameraIP, (isAlive) => {
        if (isAlive && camera.statusNow === 'OFF') {
          let timeInOffline;
          if (camera.startTimeInOffLine !== 0) {
            timeInOffline = moment(camera.startTimeInOffLine).fromNow(true);
          } else {
            timeInOffline = 0;
          }
          logger(logTypes.CAMERA_ONLINE, {
            name: camera.ftpHomeDir,
            timeInOffline,
          });
          camera.statusNow = 'ON';
          camera.startTimeInOffLine = 0;
          return;
        }
        if (
          !isAlive &&
          (camera.statusNow === 'ON' || camera.startTimeInOffLine === 0)
        ) {
          camera.startTimeInOffLine = moment() - TIMEOUT_TO_CHECK;
          camera.statusNow = 'OFF';
          logger('CAMERA_IS_DEAD', camera.ftpHomeDir);
        }
      });
      setPingTimeOut(camera, timeOut);
    }, timeOut);
  };
  return {
    startWatch: () => {
      Cameras.findAll({ where: { isOnLine: true }, raw: true }).then(
        (camerasList) => {
          let workingCam = '';
          workingCamList = camerasList.map((cam) => {
            workingCam += ` ${cam.ftpHomeDir}:${cam.cameraIP}`;
            setPingTimeOut(cam, TIMEOUT_TO_CHECK);
            cam.statusNow = 'OFF';
            cam.startTimeInOffLine = 0;
            return cam;
          });
          logger('APP_START_INFO', `WORKING_CAMERAS: ${workingCam}`);
        }
      );
    },

    cameraAction: (cameraName) => {
      const cameraIndex = workingCamList.findIndex((cam) => {
        if (cam.ftpHomeDir === cameraName) {
          return true;
        }
      });
      if (cameraIndex >= 0) {
        if (workingCamList[cameraIndex].statusNow !== 'ON') {
          const timeInOffline = moment(
            workingCamList[cameraIndex].startTimeInOffLine
          ).fromNow(true);
          logger(logTypes.CAMERA_ONLINE, { name: cameraName, timeInOffline });
          workingCamList[cameraIndex].statusNow = 'ON';
          workingCamList[cameraIndex].startTimeInOffLine = 0;
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
