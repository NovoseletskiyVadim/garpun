/* eslint-disable no-shadow */
/* eslint-disable class-methods-use-this */
const { Op } = require('sequelize');
const moment = require('moment');

const { camerasWatcher } = require('../childProcesses');
const Cameras = require('../../models/cameras');
const CamEvents = require('../../models/camEvent');
const ChartCreator = require('./chartCreator');
const botIcons = require('../telegBot/botIcons');
const { printLog } = require('../logger/appLogger');
const { AppError } = require('../errorHandlers');

class GetEventsStat {
    constructor(timeFrom, timeTo, cameraName, eventFilter) {
        this.timeFrom = timeFrom || moment().format('YYYY-MM-DD');
        this.timeTo = timeTo || `${this.timeFrom} 23:59:59`;
        this.cameraName = cameraName || false;
        this.eventFilter = eventFilter || false;
        this.timeZone = moment.tz.zonesForCountry('UA', true);
        this.timeOffset = Math.abs(this.timeZone[0].offset);
    }

    static reportRowsNames = {
        timeFrom0to2: '0-2',
        timeFrom2to15: '2-15',
        timeFrom15to30: '15-30',
        timeFrom30to60: '30-60',
        timeMore60: 'More 60',
        timeLess0: 'Less 0',
        notUploaded: 'NOT_UPLOADED',
        fileSize: 'FILE_SIZE',
        fileType: 'FILE_TYPE',
        eventName: 'EVENT_NAME',
        plateNumber: 'PLATE_NUMBER',
        timeStamp: 'TIME_STAMP',
        camTimeSync: 'CAM_TIME_SYNC',
        cameraInfo: 'CAMERA_INFO',
        apiRejected: 'API_REJECT',
        apiErrorRes: 'API_ERROR_RES',
    };

    getEventsByTimeStat(camEvent, acc) {
        const { ...statObject } = acc;
        const eventHour = moment(camEvent.createdAt, 'YYYY-MM-DD hh:mm:ss.sss')
            .add(this.timeOffset, 'minutes')
            .get('h');
        if (!statObject[eventHour]) {
            statObject[eventHour] = 0;
        }
        statObject[eventHour] += 1;
        return statObject;
    }

    getEventErrorStat(camEvent, acc) {
        const { ...statObject } = acc;
        if (
            Object.prototype.hasOwnProperty.call(camEvent, 'fileErrors') &&
            typeof camEvent.fileErrors === 'string'
        ) {
            const fileErrorsList = camEvent.fileErrors.split(',');
            fileErrorsList.forEach((item) => {
                if (!item) return;
                if (!statObject[item]) {
                    statObject[item] = 0;
                }
                statObject[item] += 1;
            });
        }
        return statObject;
    }

    getApiResTimeStat(camEvent, acc) {
        const { ...statObject } = acc;
        let notUploaded = statObject.notUploaded || 0;
        let apiErrorRes = statObject.apiErrorRes || 0;
        let timeFrom0to2 = statObject.timeFrom0to2 || 0;
        let timeFrom2to15 = statObject.timeFrom2to15 || 0;
        let timeFrom15to30 = statObject.timeFrom15to30 || 0;
        let timeFrom30to60 = statObject.timeFrom30to60 || 0;
        let timeMore60 = statObject.timeMore60 || 0;
        let timeLess0 = statObject.timeLess0 || 0;
        if (camEvent.uploaded) {
            try {
                const eventTime = moment(
                    camEvent.time,
                    'YYYY-MM-DD hh:mm:ss.sss'
                ).add(this.timeOffset, 'minutes');
                const apiRespObject = JSON.parse(camEvent.apiResponse);
                if (
                    Object.prototype.hasOwnProperty.call(
                        apiRespObject,
                        'datetime'
                    )
                ) {
                    const { datetime } = apiRespObject;
                    const apiRespTime = moment(datetime);
                    const delayTime = (apiRespTime - eventTime) / 60000;
                    if (Number.isNaN(delayTime)) {
                        apiErrorRes += 1;
                    }
                    if (delayTime >= 60) {
                        timeMore60 += 1;
                    } else if (delayTime >= 30) {
                        timeFrom30to60 += 1;
                    } else if (delayTime >= 15) {
                        timeFrom15to30 += 1;
                    } else if (delayTime >= 2) {
                        timeFrom2to15 += 1;
                    } else if (delayTime < 2 && delayTime > 0) {
                        timeFrom0to2 += 1;
                    } else {
                        timeLess0 += 1;
                    }
                } else {
                    apiErrorRes += 1;
                }
            } catch (error) {
                apiErrorRes += 1;
            }
        } else {
            notUploaded += 1;
        }
        return {
            notUploaded,
            apiErrorRes,
            timeFrom0to2,
            timeFrom2to15,
            timeFrom15to30,
            timeFrom30to60,
            timeMore60,
            timeLess0,
        };
    }

    getStatFormEventsArray(eventsArray) {
        let apiResTime = {};
        let eventsByTime = {};
        let eventsErrorsStat = {};
        eventsArray.forEach((camEvent) => {
            eventsErrorsStat = {
                ...this.getEventErrorStat(camEvent, eventsErrorsStat),
            };
            eventsByTime = {
                ...this.getEventsByTimeStat(camEvent, eventsByTime),
            };
            apiResTime = { ...this.getApiResTimeStat(camEvent, apiResTime) };
        });
        return { apiResTime, eventsByTime, eventsErrorsStat };
    }

    checkTimeFormat(dateTime, timeType) {
        const regex = /^(\d{4}-\d{2}-\d{2})\s?(\d{2}:\d{2}:\d{2})?$/g;
        const found = regex.exec(dateTime);
        if (found === null) {
            return {
                checkResult: false,
            };
        }
        const day = found[1];
        let time = found[2];
        let timeToCheck = '';
        if (!time) {
            time = timeType ? '00:00:00' : '23:59:59';
        }
        timeToCheck = `${day} ${time}`;
        const timeObjectMoment = moment(timeToCheck, 'YYYY-MM-DD hh:mm:ss');
        return {
            checkResult: timeObjectMoment.isValid(),
            timeToCheck,
        };
    }

    checkDates() {
        const dateFrom = this.checkTimeFormat(this.timeFrom, true);
        const dateTo = this.checkTimeFormat(this.timeTo, false);
        if (!dateFrom.checkResult || !dateTo.checkResult) {
            return {
                isDataOk: false,
                errorMsg:
                    'GetEventsStat ERROR Time should be like YYYY-MM-DD or YYYY-MM-DD hh:mm:ss',
            };
        }
        const difInTime = dateTo - dateFrom;
        if (difInTime < 0) {
            return {
                isDataOk: false,
                errorMsg:
                    'GetEventsStat ERROR Time TO cannot be less then FROM time',
            };
        }
        return {
            isDataOk: true,
            dateFrom: dateFrom.timeToCheck,
            dateTo: dateTo.timeToCheck,
        };
    }

    getStat() {
        const checkResult = this.checkDates();
        if (checkResult.isDataOk) {
            let camerasList = [];
            const eventsDbRequest = {
                raw: true,
                where: {
                    createdAt: {
                        [Op.between]: [
                            checkResult.dateFrom,
                            checkResult.dateTo,
                        ],
                    },
                },
            };
            if (this.cameraName && typeof this.cameraName === 'string') {
                camerasList.push({ ftpHomeDir: this.cameraName });
                eventsDbRequest.where.camera = this.cameraName;
            } else {
                camerasList = Cameras.findAll({
                    raw: true,
                    where: {
                        // isOnLine: true,
                    },
                });
            }
            if (this.eventFilter && typeof this.eventFilter === 'string') {
                if (this.eventFilter === 'NOT_UPLOADED') {
                    eventsDbRequest.where.uploaded = false;
                } else {
                    eventsDbRequest.where.fileErrors = {
                        [Op.like]: `%${this.eventFilter}%`,
                    };
                }
            }

            const eventsList = CamEvents.findAll(eventsDbRequest);
            return Promise.all([camerasList, eventsList]).then((result) => {
                const [camerasList, eventsList] = result;
                const { apiResTime, eventsByTime, eventsErrorsStat } =
                    this.getStatFormEventsArray(eventsList);

                const statReport = {
                    timeFilter: checkResult,
                    eventCount: eventsList.length,
                    eventsByTime,
                    apiResTime,
                    eventsErrorsStat,
                    filteredByCameras: [],
                };
                camerasList.forEach((camera) => {
                    const eventsByCameraArray = eventsList.filter((event) => {
                        if (event.camera === camera.ftpHomeDir) {
                            return event;
                        }
                        return false;
                    });
                    const cameraEventsStat =
                        this.getStatFormEventsArray(eventsByCameraArray);
                    statReport.filteredByCameras.push({
                        cameraName: camera.ftpHomeDir,
                        eventCount: eventsByCameraArray.length,
                        cameraEventsStat,
                    });
                });
                return statReport;
            });
        }
        return Promise.reject(checkResult.errorMsg);
    }

    static getLastCamsEventsTime() {
        return new Promise((resolve) => {
            camerasWatcher.send({ type: 'GET_STATS' });
            camerasWatcher.on('message', (data) => {
                const { cameraStats } = data;
                if (cameraStats) {
                    resolve(cameraStats);
                }
            });
        });
    }

    static async createStatMessage(dataArray, messageHeader, chartType = null) {
        const dataKeys = Object.keys(dataArray);
        let message = '';
        if (dataKeys.length > 0) {
            message += `<strong>${messageHeader}:</strong>\n`;
            const dateObjForChart = {};
            dataKeys.forEach((keyName) => {
                const value = dataArray[keyName];
                if (value > 0) {
                    const keyNameForMsg =
                        GetEventsStat.reportRowsNames[keyName] || keyName;
                    message += `${keyNameForMsg}: ${value}\n`;
                    dateObjForChart[keyNameForMsg] = value;
                }
            });
            if (chartType) {
                const chart = new ChartCreator(
                    dateObjForChart,
                    chartType,
                    messageHeader
                );
                try {
                    const chartUrl = await chart.createChart().getShortUrl();
                    message += `${chartUrl}\n`;
                } catch (error) {
                    printLog(new AppError(error, 'TASK_SCHEDULE').toPrint()).error().toErrorLog();
                }

            }
        }
        return message;
    }

    static async printStatReport(statReport) {
        const {
            eventsByTime,
            apiResTime,
            eventsErrorsStat,
            filteredByCameras,
            timeFilter,
            eventCount,
        } = statReport;
        const msgChunkArray = [];
        let globalEventCalcMsg = `<strong>Harpoon daily stat from ${timeFilter.dateFrom} to ${timeFilter.dateTo}</strong>\n<strong>Total events count:</strong> ${eventCount}\n`;

        if (Object.keys(eventsByTime).length > 0) {
            const eventsByTimeChart = new ChartCreator(
                eventsByTime,
                'line',
                'Events by time'
            );
            try {
                const eventsByTimeChartUrl = await eventsByTimeChart
                .createChart()
                .getShortUrl();
                globalEventCalcMsg += eventsByTimeChartUrl;
            } catch (error) {
                printLog(new AppError(error, 'TASK_SCHEDULE').toPrint()).error().toErrorLog();
            }

        }
        msgChunkArray.push(globalEventCalcMsg);
        msgChunkArray.push(
            await GetEventsStat.createStatMessage(
                apiResTime,
                'API response time',
                'doughnut'
            )
        );
        msgChunkArray.push(
            await GetEventsStat.createStatMessage(
                eventsErrorsStat,
                'Events errors',
                'pie'
            )
        );

        filteredByCameras.sort((a, b) => {
            if (a.cameraName < b.cameraName) {
                return -1;
            }
            if (a.cameraName > b.cameraName) {
                return 1;
            }
            return 0;
        });
        const lastCamEventsTime = await GetEventsStat.getLastCamsEventsTime();
        const statByCameras = filteredByCameras.map(async (cameraData) => {
            const cameraStatMsg = [];
            const { cameraName, eventCount, cameraEventsStat } = cameraData;
            const lastTimeEvent = lastCamEventsTime.find((cameraInfo) => {
                if (cameraInfo.ftpHomeDir === cameraName) {
                    return cameraInfo;
                }
                return false;
            });
            const { apiResTime, eventsByTime, eventsErrorsStat } =
                cameraEventsStat;
            cameraStatMsg.push(
                `<strong>${cameraName} events ${eventCount}</strong>\n`
            );
            let lastEventMsg = 'Not active';
            if (lastTimeEvent && lastTimeEvent.lastEvent) {
                const lastEventTime = moment(lastTimeEvent.lastEvent).add(
                    this.timeOffset,
                    'minutes'
                );
                const timeNow = moment();
                lastEventMsg = moment(lastEventTime).format(
                    'YYYY-MM-DD HH:mm:ss'
                );
                if (
                    parseInt(((timeNow - lastEventTime) / 1000).toFixed(), 10) >
                    86400
                ) {
                    lastEventMsg += ` ${botIcons.CAMERA_OFFLINE_WARNING}`;
                }
            }
            cameraStatMsg.push(
                `<strong>Last event time:</strong> ${lastEventMsg}\n`
            );

            const apiResTimeMsg = await GetEventsStat.createStatMessage(
                apiResTime,
                'API response time'
            );

            if (apiResTimeMsg.length) {
                cameraStatMsg.push(apiResTimeMsg);
            }

            const eventsErrorsStatMsg = await GetEventsStat.createStatMessage(
                eventsErrorsStat,
                'Event errors'
            );

            if (eventsErrorsStatMsg.length) {
                cameraStatMsg.push(eventsErrorsStatMsg);
            }
            if (Object.keys(eventsByTime).length > 0) {
                const eventsByTimeChart = new ChartCreator(
                    eventsByTime,
                    'line',
                    'Events by time'
                );
                try {
                    const chartUrl = await eventsByTimeChart
                    .createChart()
                    .getShortUrl();
                    cameraStatMsg.push(`${chartUrl} \n`);
                } catch (error) {   
                    printLog(new AppError(error, 'TASK_SCHEDULE').toPrint()).error().toErrorLog();
                }
            }
            return cameraStatMsg.join('');
        });
        return Promise.all(statByCameras).then((statByCamerasResult) => [
            ...msgChunkArray,
            ...statByCamerasResult,
        ]);
    }
}

module.exports = GetEventsStat;
