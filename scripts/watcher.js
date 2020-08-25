const chokidar = require('chokidar');
const FileType = require('file-type');
const path = require('path');
const fs = require('fs');
require('dotenv').config();
const jsonSender = require('./../utils/jsonSender');
const logger = require('./../utils/logger');

if (!fs.existsSync(path.join(__dirname, './../logs'))) {
  fs.mkdirSync(path.join(__dirname, './../logs'));
}

const watcher = chokidar.watch(process.env.MEDIA_PATH, {
  ignored: /^\./,
  persistent: true,
});

watcher
  .on('add', async (pathFile) => {
    const fileData = await FileType.fromFile(pathFile);
    if (fileData && fileData.ext === 'jpg') {
      const eventMeta = path.basename(pathFile, '.jpg');
      jsonSender(eventMeta);
    } else {
      logger.saveErrorEvent({ message: 'WRONG_FILE_TYPE' + ' ' + pathFile });
      console.log('WRONG_FILE_TYPE', pathFile);
    }
  })
  .on('change', function (path) {
    console.log('File', path, 'has been changed');
  })
  .on('unlink', function (path) {
    logger.removeFileLog({ pathFile: path });
    console.log('File', path, 'has been removed');
  })
  .on('error', function (error) {
    console.error('Error happened', error);
  });
