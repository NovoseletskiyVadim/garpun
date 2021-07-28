const moment = require('moment');

const dbConnect = require('../db/dbConnect');
const appErrorLog = require('../utils/logger/logToFile');

const GetEventsStat = require('../utils/statCollector/eventStat');
const ReportsQuery = require('../models/reports');

const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
console.log(yesterday);
const task = new GetEventsStat(yesterday);

task
  .getStat()
  .then((report) => {
    console.log(report.filteredByCameras[0]);
    const jsonReport = JSON.stringify(report);
    return ReportsQuery.create({ reportData: jsonReport }).then((newReport) => {
      return newReport.save();
    });
  })
  .then(() => {
    dbConnect.stop();
  })
  .catch((error) => {
    console.log(error);
    appErrorLog.appErrorLog({ message: { error } });
  });
