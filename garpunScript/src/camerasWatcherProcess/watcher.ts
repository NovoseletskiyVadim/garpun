import moment from 'moment';
// eslint-disable-next-line import/no-import-module-exports
import { CameraModel } from '../models/camera';
import { CamEventModel } from '../models/camEvent';
import { appLogger } from '../logger/appLogger';
import config from '../common/config';
import { AppError } from '../errorHandlers/appError';
import botIcons from '../telegBot/botIcons';

// const config = require('../../common/config.js');
// const { AppError } = require('../errorHandlers');
// const botIcons = require('../telegBot/botIcons');

export type CameraInfo = {
    ftpHomeDir: string;
    lastEvent: Date;
}

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

export  const watcher = () => {
    const workingCamList:any[] = [];
    const setAlertTimeOut = (camera:any, timeOut: number) => {
        camera.alertSend = setTimeout(() => {
            if (camera.statusNow) {
                const timeInOffline = moment(camera.lastEvent).fromNow(true);
                const lastEvent = moment(camera.lastEvent).format(
                    'YYYY-MM-DD HH:mm:ss'
                );
                const textMsg = `${botIcons.CAMERA_OFFLINE}CAMERA ${camera.ftpHomeDir} OFFLINE ${timeInOffline}\nLast event at ${lastEvent}`;
                appLogger.setLogMessage(textMsg)
                    .errorSecond()
                    .botMessage();
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
            appLogger.setLogMessage('Start fetching cameras info').appInfoMessage();
            return CameraModel.findAll({
                raw: true,
                where: {
                    isOnLine: true,
                },
            })
                .then((camerasList:any[]) => {
                    const arrayReqToDb = camerasList.map((item) => {
                        const cam = { ...item };
                        return CamEventModel.findOne({
                            limit: 1,
                            where: {
                                camera: cam.ftpHomeDir,
                            },
                            order: [['createdAt', 'DESC']],
                        }).then((lastEvent:any) => {
                            cam.lastEvent = null;
                            if (lastEvent) {
                                const { createdAt } = lastEvent;
                                cam.lastEvent = moment(createdAt);
                            }
                            appLogger.setLogMessage(
                                `cameraName: ${cam.ftpHomeDir} lastEvent: ${cam.lastEvent}`
                            ).successful();
                            return cam;
                        });
                    });

                    return Promise.all(arrayReqToDb);
                })
                .then((camerasList:any[]) => {
                    camerasList.forEach((item) => {
                        const cam = { ...item };
                        setAlertTimeOut(cam, config.TIMEOUT_CAMERA_OFF_ALERT);
                        cam.statusNow = false;
                        workingCamList.push(cam);
                    });
                    return true;
                })
                .catch((error:any) => {
                    appLogger.setLogMessage(
                        new AppError(error, 'CAM_WATCHER_ERROR')
                    ).error();
                });
        },
        /**
         * @method
         * Called when harpoon gets event from camera.
         * Cleared time to bot warning alert.
         * If camera was in offline, bot send message that camera online and time in offline
         * @returns {void}
         */
        cameraAction(cameraName:string) {
            const cameraIndex = workingCamList.findIndex((cam) => {
                if (cam.ftpHomeDir === cameraName) {
                    return true;
                }
                return false;
            });
            if (cameraIndex >= 0) {
                let timeInOffline: undefined | string;
                if (!workingCamList[cameraIndex].statusNow) {
                    const { lastEvent } = workingCamList[cameraIndex];
                    timeInOffline = lastEvent
                        ? moment(lastEvent).fromNow(true)
                        : undefined;
                    const timeOffLineText = `\nOFFLINE ${timeInOffline}`;
                    const textMsg = `${botIcons.CAMERA_ONLINE}CAMERA ${cameraName} ONLINE ${
                        timeInOffline ? timeOffLineText : ''
                    }`;

                    appLogger.setLogMessage(textMsg)
                        .successful()
                        .botMessage();
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
        getLastCamerasEvents():Array<CameraInfo> {
            return workingCamList.map((camera) => {
                const { ftpHomeDir, lastEvent } = camera;
                return { ftpHomeDir, lastEvent };
            });

        },
    };
};
