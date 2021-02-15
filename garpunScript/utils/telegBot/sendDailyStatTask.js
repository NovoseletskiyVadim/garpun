const moment = require('moment');

require('dotenv').config({ path: './../../.env' });
process.env.NODE_ENV = 'PROD';
const logToFile = require('../logger/logToFile');

const dbConnect = require('../../db/dbConnect');

const { sendManyMessages } = require('../telegBot/harpoonBot');

const GetEventsStat = require('../statCollector/eventStat');

const yesterday = moment().subtract(1, 'days').format('YYYY-MM-DD');
const task = new GetEventsStat(yesterday);

task
  .printStatReport()
  .then((text) => {
    return sendManyMessages(text);
    console.log(text);
  })
  .catch((error) => {
    console.error(error);
    // logToFile({ message: { error } });
  });
