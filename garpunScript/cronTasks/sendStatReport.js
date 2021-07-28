const moment = require('moment');
const { Op } = require('sequelize');
const QuickChart = require('quickchart-js');

const dbConnect = require('../db/dbConnect');
const { sendManyMessages } = require('../utils/telegBot/harpoonBot');
const GetEventsStat = require('../utils/statCollector/eventStat');
const ReportsQuery = require('../models/reports');
const appErrorLog = require('../utils/logger/logToFile');

const today = moment().format('YYYY-MM-DD');
let chunkToPrint = [];
ReportsQuery.findOne({
  where: {
    createdAt: { [Op.startsWith]: today },
  },
})
  .then((report) => {
    if (!report) throw new Error('Report not found');
    const { reportData } = report;
    const reportObject = JSON.parse(reportData);
    const { eventsByTime, apiResTime, eventsErrorsStat } = reportObject;

    const labelsEventsByTime = Object.keys(eventsByTime);
    const dataEventsByTime = Object.values(eventsByTime);

    let filteredEventsByTime = {};
    Object.keys(apiResTime).forEach((filterName, i) => {
      if (apiResTime[filterName] > 0) {
        filteredEventsByTime[GetEventsStat.reportRowsNames[filterName]] =
          apiResTime[filterName];
      }
    });
    const labelsApiTime = Object.keys(filteredEventsByTime);
    const dataApiTime = Object.values(filteredEventsByTime);

    let filteredEventsErrors = {};
    Object.keys(eventsErrorsStat).forEach((filterName, i) => {
      if (eventsErrorsStat[filterName] > 0) {
        filteredEventsErrors[filterName] = eventsErrorsStat[filterName];
      }
    });
    const labelsEventsErrors = Object.keys(filteredEventsErrors);
    const dataEventsErrors = Object.values(filteredEventsErrors);

    chunkToPrint = GetEventsStat.printStatReport(reportObject);

    const eventsByTimeChart = new QuickChart();
    eventsByTimeChart
      .setConfig({
        type: 'line',
        data: {
          labels: labelsEventsByTime,
          datasets: [{ label: 'Load chart', data: dataEventsByTime }],
        },
      })
      .setWidth(800)
      .setHeight(400)
      .setBackgroundColor('transparent');

    const apiResTimeChart = new QuickChart();
    apiResTimeChart.setConfig({
      type: 'doughnut',
      data: {
        datasets: [
          {
            data: dataApiTime,
            backgroundColor: [
              '#FDAC53',
              '#9BB7D4',
              '#B55A30',
              '#F5DF4D',
              '#0072B5',
              '#A0DAA9',
              '#E9897E',
              '#00A170',
              '#926AA6',
            ],
            label: 'Dataset 1',
          },
        ],
        labels: labelsApiTime,
      },
      options: {
        title: {
          display: true,
          text: 'API response',
        },
      },
    });

    const eventsErrorsChart = new QuickChart();
    eventsErrorsChart.setConfig({
      type: 'pie',
      data: {
        datasets: [
          {
            data: dataEventsErrors,
            backgroundColor: [
              '#926AA6',
              '#00A170',
              '#E9897E',
              '#0072B5',
              '#A0DAA9',
              '#FDAC53',
              '#F5DF4D',
              '#9BB7D4',
              '#B55A30',
            ],
            label: 'Dataset 1',
          },
        ],
        labels: labelsEventsErrors,
      },
      options: {
        title: {
          display: true,
          text: 'Events errors',
        },
      },
    });

    const apiChartUrl =
      labelsApiTime.length === 0
        ? Promise.reject()
        : apiResTimeChart.getShortUrl();
    const eventsByTimeUrl =
      labelsEventsByTime.length === 0
        ? Promise.reject()
        : eventsByTimeChart.getShortUrl();
    const eventsErrorsChartUrl =
      labelsEventsErrors.length === 0
        ? Promise.reject()
        : eventsErrorsChart.getShortUrl();

    return Promise.allSettled([
      apiChartUrl,
      eventsByTimeUrl,
      eventsErrorsChartUrl,
    ]).then((result) => {
      let urlsArray = [];
      result.forEach((item) => {
        if (item.status === 'fulfilled') {
          urlsArray.push(item.value);
        }
      });
      return urlsArray;
    });
  })
  .then((chartUrl) => {
    chunkToPrint.splice(1, 0, ...chartUrl);
    console.log(chunkToPrint);
    sendManyMessages(chunkToPrint);
    return dbConnect.stop();
  })
  .catch((error) => {
    console.log(error);
    appErrorLog.appErrorLog({ message: { error } });
  });
