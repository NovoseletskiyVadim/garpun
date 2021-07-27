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

  eventReducer(reduceResult, camEvent) {
    if (camEvent.uploaded) {
      const eventTime = moment(camEvent.time, 'YYYY-MM-DD hh:mm:ss.sss').add(
        this.timeOffset,
        'minutes'
      );
      let dateTime;
      try {
        const apiRespObject = JSON.parse(camEvent.apiResponse);
        if (apiRespObject.hasOwnProperty('datetime')) {
          dateTime = apiRespObject.datetime;
        } else {
          reduceResult.apiErrorRes += 1;
          return reduceResult;
        }
      } catch (error) {
        reduceResult.apiErrorRes += 1;
        return reduceResult;
      }
      const apiRespTime = moment(dateTime);
      const delayTime = (apiRespTime - eventTime) / 60000;
      if (isNaN(delayTime)) {
        console.log('delayTime');
      }
      if (delayTime >= 60) {
        reduceResult.timeMore60 += 1;
      } else if (delayTime >= 30) {
        reduceResult.timeFrom30to60 += 1;
      } else if (delayTime >= 15) {
        reduceResult.timeFrom15to30 += 1;
      } else if (delayTime >= 2) {
        reduceResult.timeFrom2to15 += 1;
      } else if (delayTime < 2 && delayTime > 0) {
        reduceResult.timeFrom0to2 += 1;
      } else {
        reduceResult.timeLess0 += 1;
      }
    } else {
      reduceResult.notUploaded += 1;
      if (camEvent.apiResponse) {
        reduceResult.apiRejected += 1;
      }
      if (
        camEvent.hasOwnProperty('fileErrors') &&
        typeof camEvent.fileErrors === 'string'
      ) {
        const fileErrorsList = camEvent.fileErrors.split(',');
        fileErrorsList.forEach((item) => {
          const keyName = Object.keys(this.reportRowsNames).find(
            (key) => this.reportRowsNames[key] === item
          );
          if (keyName) {
            reduceResult[keyName] += 1;
          }
        });
      }
    }
    return reduceResult;
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
        let statReport = {
          timeFilter: checkResult,
          eventCount: eventsList.length,
          filteredByCameras: [],
          eventsByTime: {},
        };
        eventsList.forEach((event) => {
          const eventTime = moment(event.createdAt, 'YYYY-MM-DD hh:mm:ss.sss')
            .add(this.timeOffset, 'minutes')
            .get('h');
          if (!statReport.eventsByTime[eventTime]) {
            statReport.eventsByTime[eventTime] = 0;
          }
          statReport.eventsByTime[eventTime] += 1;
        });
        const filteredByCamerasArray = camerasList.map((camera, i) => {
          const filteredEventsByCamera = eventsList.filter((event) => {
            if (event.camera === camera.ftpHomeDir) {
              return event;
            }
          });
          let reducerDefault = {};
          Object.keys(this.reportRowsNames).forEach((nameRow) => {
            reducerDefault[nameRow] = 0;
          });
          const filteredByType = filteredEventsByCamera.reduce(
            this.eventReducer.bind(this),
            reducerDefault
          );
          const reqDelay = REQUEST_TIME_OUT * (i + 1);
          return this.getLastEventTime(camera.ftpHomeDir, reqDelay).then(
            (lastTimeEvent) => {
              statReport.filteredByCameras.push({
                cameraName: camera.ftpHomeDir,
                eventCount: filteredEventsByCamera.length,
                filteredByType,
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
      const { cameraName, eventCount, lastTimeEvent, filteredByType } =
        cameraData;
      let cameraStat = `<strong>${cameraName} events ${eventCount}</strong>\n`;
      cameraStat += `Last event time: ${lastTimeEvent}\n`;

      Object.keys(filteredByType).forEach((filterName) => {
        if (filteredByType[filterName] > 0) {
          cameraStat += `${GetEventsStat.reportRowsNames[filterName]} : ${cameraData.filteredByType[filterName]}\n`;
        }
      });
      msgArr.push(cameraStat);
    });
    return msgArr;
  }
}

module.exports = GetEventsStat;
