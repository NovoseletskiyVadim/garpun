const moment = require('moment');

const Cameras = require('../../models/cameras');
const { printLog, logTypes } = require('../logger/appLogger');

module.exports = () => {
  let workingCamList = [];
  const TIMEOUT_TO_ALERT = process.env.TIMEOUT_CAMERA_OFF_ALERT || 3600000; // after one hour
  const setAlertTimeOut = (camera, timeOut) => {
    camera.alertSend = setTimeout(() => {
      let timeInOffline = moment(camera.lastEvent).fromNow(true);
      if (camera.statusNow) {
        printLog(logTypes.CAMERA_OFFLINE, {
          name: camera.ftpHomeDir,
          timeInOffline,
        });
      }
      camera.statusNow = false;

      setAlertTimeOut(camera, timeOut);
    }, timeOut);
  };
  return {
    startWatch: () => {
      Cameras.findAll({ raw: true })
        .then((camerasList) => {
          workingCamList = camerasList.map((cam) => {
            setAlertTimeOut(cam, TIMEOUT_TO_ALERT);
            cam.lastEvent = moment();
            cam.statusNow = false;
            return cam;
          });
        })
        .catch((error) => {
          printLog(logTypes.APP_ERROR, {
            errorType: 'CAM_WATCHER_ERROR',
            errorData: error.stack,
          });
        });
    },

    cameraAction: (cameraName) => {
      const cameraIndex = workingCamList.findIndex((cam) => {
        if (cam.ftpHomeDir === cameraName) {
          return true;
        }
      });
      if (cameraIndex >= 0) {
        let timeInOffline = 0;
        if (!workingCamList[cameraIndex].statusNow) {
          timeInOffline = moment(workingCamList[cameraIndex].lastEvent).fromNow(
            true
          );
          printLog(logTypes.CAMERA_ONLINE, {
            name: cameraName,
            timeInOffline,
          });
          workingCamList[cameraIndex].statusNow = true;
        }
        workingCamList[cameraIndex].lastEvent = moment();
        clearTimeout(workingCamList[cameraIndex].alertSend);
        setAlertTimeOut(workingCamList[cameraIndex], TIMEOUT_TO_ALERT);
      }
    },
  };
};
