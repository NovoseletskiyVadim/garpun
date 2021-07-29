const moment = require('moment');
const { Op } = require('sequelize');

const dbConnect = require('../db/dbConnect');
const { sendManyMessages } = require('../utils/telegBot/harpoonBot');
const GetEventsStat = require('../utils/statCollector/eventStat');
const ReportsQuery = require('../models/reports');
const appErrorLog = require('../utils/logger/logToFile');

const today = moment().format('YYYY-MM-DD');

ReportsQuery.findOne({
  where: {
    createdAt: { [Op.startsWith]: today },
  },
})
  .then((report) => {
    if (!report) throw new Error('Report not found');
    const { reportData } = report;
    const reportObject = JSON.parse(reportData);
    return GetEventsStat.printStatReport(reportObject);
  })
  .then((chunkToPrint) => {
    sendManyMessages(chunkToPrint);
    return dbConnect.stop();
  })
  .catch((error) => {
    console.log(error);
    appErrorLog.appErrorLog({ message: { error } });
  });
