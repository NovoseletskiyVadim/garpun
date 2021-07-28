const { Op } = require('sequelize');
const moment = require('moment');

const Cameras = require('../../models/cameras');
const CamEvents = require('../../models/camEvent');

const REQUEST_TIME_OUT = 1000;

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
      camEvent.hasOwnProperty('fileErrors') &&
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
        const eventTime = moment(camEvent.time, 'YYYY-MM-DD hh:mm:ss.sss').add(
          this.timeOffset,
          'minutes'
        );
        const apiRespObject = JSON.parse(camEvent.apiResponse);
        if (apiRespObject.hasOwnProperty('datetime')) {
          const { dateTime } = apiRespObject;
          const apiRespTime = moment(dateTime);
          const delayTime = (apiRespTime - eventTime) / 60000;
          if (isNaN(delayTime)) {
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
        console.log(error);
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
      eventsByTime = { ...this.getEventsByTimeStat(camEvent, eventsByTime) };
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
        errorMsg: 'GetEventsStat ERROR Time TO cannot be less then FROM time',
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
            [Op.between]: [checkResult.dateFrom, checkResult.dateTo],
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

        let statReport = {
          timeFilter: checkResult,
          eventCount: eventsList.length,
          eventsByTime,
          apiResTime,
          eventsErrorsStat,
          filteredByCameras: [],
        };
        const filteredByCamerasArray = camerasList.map((camera, i) => {
          const eventsByCameraArray = eventsList.filter((event) => {
            if (event.camera === camera.ftpHomeDir) {
              return event;
            }
          });
          const cameraEventsStat =
            this.getStatFormEventsArray(eventsByCameraArray);
          const reqDelay = REQUEST_TIME_OUT * (i + 1);
          return this.getLastEventTime(camera.ftpHomeDir, reqDelay).then(
            (lastTimeEvent) => {
              statReport.filteredByCameras.push({
                cameraName: camera.ftpHomeDir,
                eventCount: eventsByCameraArray.length,
                cameraEventsStat,
                lastTimeEvent,
              });
              return;
            }
          );
        });
        return Promise.all(filteredByCamerasArray).then((filtered) => {
          return statReport;
        });
      });
    } else {
      return Promise.reject(checkResult.errorMsg);
    }
  }

  getLastEventTime(cameraName, timeOutRequest) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        CamEvents.findOne({
          limit: 1,
          where: {
            camera: cameraName,
          },
          order: [['createdAt', 'DESC']],
        })
          .then((lastEvent) => {
            let lastTimeEvent = 'Not active';
            if (lastEvent) {
              const { createdAt } = lastEvent;
              try {
                lastTimeEvent = moment(createdAt).format('YYYY-MM-DD HH:mm:ss');
              } catch (error) {
                console.error(error);
                lastTimeEvent = createdAt;
              }
            }
            return resolve(lastTimeEvent);
          })
          .catch((error) => {
            reject(error);
          });
      }, timeOutRequest);
    });
  }

  static printStatReport(statReport) {
    statReport.filteredByCameras.sort((a, b) => {
      if (a.cameraName < b.cameraName) {
        return -1;
      }
      if (a.cameraName > b.cameraName) {
        return 1;
      }
      return 0;
    });
    let msgArr = [];
    let textMsg = `<strong>Harpoon daily stat from ${statReport.timeFilter.dateFrom} to ${statReport.timeFilter.dateTo}</strong> \n`;
    textMsg += `Total events count ${statReport.eventCount} \n\n`;
    msgArr.push(textMsg);
    statReport.filteredByCameras.forEach((cameraData) => {
      const { cameraName, eventCount, lastTimeEvent, cameraEventsStat } =
        cameraData;
      const { apiResTime, eventsByTime, eventsErrorsStat } = cameraEventsStat;
      let cameraStat = `<strong>${cameraName} events ${eventCount}</strong>\n`;
      cameraStat += `<strong>Last event time:</strong> ${lastTimeEvent}\n`;
      Object.keys(eventsByTime).forEach((filterName, i) => {
        if (eventsByTime[filterName] > 0) {
          if (i === 0) {
            cameraStat += `<strong>Events by time:</strong>\n`;
          }
          cameraStat += `${filterName} : ${eventsByTime[filterName]}\n`;
        }
      });
      Object.keys(apiResTime).forEach((filterName, i) => {
        if (apiResTime[filterName] > 0) {
          if (i === 0) {
            cameraStat += `<strong>API response time:</strong>\n`;
          }
          cameraStat += `${GetEventsStat.reportRowsNames[filterName]} : ${apiResTime[filterName]}\n`;
        }
      });
      Object.keys(eventsErrorsStat).forEach((filterName, i) => {
        if (eventsErrorsStat[filterName] > 0) {
          if (i === 0) {
            cameraStat += `<strong>Event errors:</strong>\n`;
          }
          cameraStat += `${filterName} : ${eventsErrorsStat[filterName]}\n`;
        }
      });
      msgArr.push(cameraStat);
    });
    return msgArr;
  }
}

module.exports = GetEventsStat;
