/* eslint-disable no-param-reassign */
const moment = require('moment');

const Cameras = require('../../models/cameras');
const CamEvents = require('../../models/camEvent');
const { printLog, logTypes } = require('../logger/appLogger');
const config = require('../../common/config');
const { AppError } = require('../errorHandlers');

module.exports = () => {
    const workingCamList = [];
    const setAlertTimeOut = (camera, timeOut) => {
        camera.alertSend = setTimeout(() => {
            const timeInOffline = moment(camera.lastEvent).fromNow(true);
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
        /**
         * @method
         * Start watch by cameras. Gets cameras list from db that should be online
         * After gets last events for cameras in list from db and set them time to alert
         * @returns {Promise<boolean>}
         */
        startWatch() {
            return Cameras.findAll({
                raw: true,
                where: {
                    isOnLine: true,
                },
            })
                .then((camerasList) => {
                    const arrayReqToDb = camerasList.map((item) => {
                        const cam = { ...item };
                        return CamEvents.findOne({
                            limit: 1,
                            where: {
                                camera: cam.ftpHomeDir,
                            },
                            order: [['createdAt', 'DESC']],
                        }).then((lastEvent) => {
                            cam.lastEvent = null;
                            if (lastEvent) {
                                const { createdAt } = lastEvent;
                                cam.lastEvent = moment(createdAt);
                            }
                            printLog(logTypes.APP_INFO, {
                                cameraName: cam.ftpHomeDir,
                                lastEvent: cam.lastEvent,
                            });
                            return cam;
                        });
                    });

                    return Promise.all(arrayReqToDb);
                })
                .then((camerasList) => {
                    camerasList.forEach((item) => {
                        const cam = { ...item };
                        setAlertTimeOut(cam, config.TIMEOUT_CAMERA_OFF_ALERT);
                        cam.statusNow = false;
                        workingCamList.push(cam);
                    });
                    return true;
                })
                .catch((error) => {
                    printLog(
                        logTypes.APP_ERROR,
                        new AppError(error, 'CAM_WATCHER_ERROR')
                    );
                });
        },
        /**
         * @method
         * Called when harpoon gets event from camera.
         * Cleared time to bot warning alert.
         * If camera was in offline, bot send message that camera online and time in offline
         * @returns {void}
         */
        cameraAction(cameraName) {
            const cameraIndex = workingCamList.findIndex((cam) => {
                if (cam.ftpHomeDir === cameraName) {
                    return true;
                }
                return false;
            });
            if (cameraIndex >= 0) {
                let timeInOffline = 0;
                if (!workingCamList[cameraIndex].statusNow) {
                    const { lastEvent } = workingCamList[cameraIndex];
                    timeInOffline = lastEvent
                        ? moment(lastEvent).fromNow(true)
                        : 0;
                    printLog(logTypes.CAMERA_ONLINE, {
                        name: cameraName,
                        timeInOffline,
                    });
                    workingCamList[cameraIndex].statusNow = true;
                }
                workingCamList[cameraIndex].lastEvent = moment();
                clearTimeout(workingCamList[cameraIndex].alertSend);
                setAlertTimeOut(
                    workingCamList[cameraIndex],
                    config.TIMEOUT_CAMERA_OFF_ALERT
                );
            }
        },
        /**
         * @typedef {Object} CameraInfo Info about camera
         * @property {string} CameraInfo.ftpHomeDir Camera ftp name
         * @property {Date}  CameraInfo.lastEvent - Time of last camera invent
         */
        /**
         * @method
         * Method for get list of last cameras invents
         * @returns {CameraInfo[]} Array of info about cameras
         */
        getLastCamerasEvents() {
            const camerasList = workingCamList.map((camera) => {
                const { ftpHomeDir, lastEvent } = camera;
                return { ftpHomeDir, lastEvent };
            });
            return camerasList;
        },
    };
};
