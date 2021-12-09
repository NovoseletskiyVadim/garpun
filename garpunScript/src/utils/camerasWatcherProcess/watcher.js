/* eslint-disable no-param-reassign */
const moment = require('moment');

const Cameras = require('../../models/cameras');
const CamEvents = require('../../models/camEvent');
const { printLog } = require('../logger/appLogger');
const config = require('../../common/config');
const { AppError } = require('../errorHandlers');
const { HarpoonBotMsgSender } = require('../telegBot/harpoonBot');

/**
 * @module camerasWatcher
 * @function
 * @description  This function at the beginning of work get info about cameras  from main db.
 * After for each cameras set timeout for the alert in the log and bot with msg -
 * 'CAMERA {name} OFFLINE {timeOffLine} Last event {timeLastEvent}'.
 * Is statusNow for the camera not changed to alert msg does not sent.
 * If camerasWatcher received event from camera timeout is reset to TIMEOUT_CAMERA_OFF_ALERT
 * If camera was in offline and camerasWatcher received event from that camera, sent msg -
 * 'CAMERA {cameraName} ONLINE, OFFLINE {timeInOffLine} ' and change statusNow to true
 * @returns {void}
 */

module.exports = () => {
    const workingCamList = [];
    const setAlertTimeOut = (camera, timeOut) => {
        camera.alertSend = setTimeout(() => {
            if (camera.statusNow) {
                const timeInOffline = moment(camera.lastEvent).fromNow(true);
                const lastEvent = moment(camera.lastEvent).format(
                    'YYYY-MM-DD HH:mm:ss'
                );
                const textMsg = `${HarpoonBotMsgSender.botIcons.CAMERA_OFFLINE}CAMERA ${camera.ftpHomeDir} OFFLINE ${timeInOffline}\nLast event at ${lastEvent}`;
                printLog(textMsg).errorSecond().botMessage();
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
            printLog('Start fetching cameras info').appInfoMessage();
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
                            printLog(
                                `cameraName: ${cam.ftpHomeDir} lastEvent: ${cam.lastEvent}`
                            ).successful();
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
                    printLog(new AppError(error, 'CAM_WATCHER_ERROR'))
                        .error()
                        .toErrorLog()
                        .errorGroupChatMessage();
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
                    const timeOffLineText = `\nOFFLINE ${timeInOffline}`;
                    const textMsg = `${
                        HarpoonBotMsgSender.telegramIcons.CAMERA_ONLINE
                    }CAMERA ${cameraName} ONLINE ${
                        timeInOffline !== 0 ? timeOffLineText : ''
                    }`;

                    printLog(textMsg).successful().botMessage();
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
