const fs = require('fs');

module.exports = (filePath) => {
  return new Promise((resolve, rejects) => {
    let buf;
    const stream = fs.ReadStream(filePath);

    stream.on('data', (chunk) => {
      buf += chunk.toString('base64');
    });

    stream.on('close', () => {
      console.log(buf.length, filePath);
      resolve(buf);
    });

    stream.on('error', (err) => {
      rejects(err);
    });
  });
};
