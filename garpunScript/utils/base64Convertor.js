'use strict';
const fs = require('fs');
const path = require('path');
const { appErrorLog } = require('./logger');
const fileExplorer = require('./fileExplorer');

module.exports = (eventData) => {
  return new Promise((resolve, rejects) => {
    let buf = [];
    const stream = fs.ReadStream(eventData.file.fullPath);
    let wrStream;
    if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
      const archivePath = fileExplorer.setFileDirPath(
        eventData.cameraName,
        'ARCHIVE_PATH'
      );
      wrStream = fs.WriteStream(
        path.join(archivePath, eventData.file.name + eventData.file.ext)
      );
    }

    stream.on('data', (chunk) => {
      if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
        wrStream.write(chunk);
      }
      buf.push(chunk);
    });

    stream.on('close', () => {
      if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
        wrStream.end();
      }
      const fileInBase64 = Buffer.concat(buf).toString('base64');
      fs.unlink(eventData.file.fullPath, (err) => {
        if (err) throw err;
        resolve(fileInBase64);
      });
    });

    if (parseInt(process.env.ARCHIVE_DAYS) > 0) {
      wrStream.on('error', (err) => {
        console.log(err);
      });
    }

    stream.on('error', (error) => {
      console.log(error);
      appErrorLog({ message: { text: 'BASE64_ERROR', error: error } });
      rejects(err);
    });
  });
};
