'use strict';
const fs = require('fs');
const { appErrorLog } = require('./logger');

module.exports = (filePath) => {
  return new Promise((resolve, rejects) => {
    let buf = [];
    const stream = fs.ReadStream(filePath);

    stream.on('data', (chunk) => {
      buf.push(chunk);
    });

    stream.on('close', () => {
      resolve(Buffer.concat(buf).toString('base64'));
    });

    stream.on('error', (error) => {
      appErrorLog({ message: { text: 'BASE64_ERROR', error: error } });
      rejects(err);
    });
  });
};
