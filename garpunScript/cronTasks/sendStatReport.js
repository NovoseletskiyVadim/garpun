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
    const { eventsByTime } = reportObject;
    const labels = Object.keys(eventsByTime);
    const data = Object.values(eventsByTime);
    const reportChart = new QuickChart();
    chunkToPrint = GetEventsStat.printStatReport(reportObject);
    reportChart
      .setConfig({
        type: 'line',
        data: {
          labels,
          datasets: [{ label: 'Foo', data }],
        },
      })
      .setWidth(800)
      .setHeight(400)
      .setBackgroundColor('transparent');

    return reportChart.getShortUrl();
  })
  .then((chartUrl) => {
    chunkToPrint[0] += chartUrl;
    sendManyMessages(chunkToPrint);
    return dbConnect.stop();
  })
  .catch((error) => {
    appErrorLog.appErrorLog({ message: { error } });
  });
