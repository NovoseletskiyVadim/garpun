const fs = require('fs');

module.exports = (filePath) => {
  return new Promise((resolve, rejects) => {
    let buf;
    const stream = fs.ReadStream(filePath);

    stream.on('data', (chunk) => {
      buf += chunk.toString('base64');
    });

    stream.on('close', () => {
      fs.unlink(filePath, (err) => {
        if (err) {
          rejects(err);
        } else {
          resolve(buf);
        }
        // console.log(`${buf.length}${filePath} was deleted`);
      });
    });

    stream.on('error', (err) => {
      rejects(err);
    });
  });
};
