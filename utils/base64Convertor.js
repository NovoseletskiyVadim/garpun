'use strict';
const fs = require('fs');

module.exports = (filePath) => {
  return new Promise((resolve, rejects) => {
    let buf = [];
    const stream = fs.ReadStream(filePath);

    stream.on('data', (chunk) => {
      buf.push(chunk);
    });

    stream.on('close', () => {
      fs.unlink(filePath, (err) => {
        if (err) {
          rejects(err);
        } else {
          resolve(Buffer.concat(buf).toString('base64'));
        }
        // console.log(`${buf.length}${filePath} was deleted`);
      });
    });

    stream.on('error', (err) => {
      console.log(err);
      rejects(err);
    });
  });
};
