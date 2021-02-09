const fs = require('fs');
const path = require('path');

if (!fs.existsSync(path.join(__dirname, './../../logs/'))) {
  fs.mkdirSync(path.join(__dirname, './../../logs/'));
}

const appErrorLog = (eventData) => {
  const { message } = eventData;
  const stream = fs.createWriteStream(
    path.join(__dirname, './../../logs/error.log'),
    { flags: 'a' }
  );
  stream.write(
    `${JSON.stringify({
      time: new Date(),
      message,
    })}\n`
  );
  stream.end();
};

const rejectFileLog = (eventData) => {
  const stream = fs.createWriteStream(
    path.join(__dirname, './../../logs/reject.log'),
    { flags: 'a' }
  );
  stream.write(
    `${JSON.stringify({
      time: new Date(),
      message: eventData.message,
      file: eventData.file,
    })}\n`
  );
  stream.end();
};

module.exports = { rejectFileLog, appErrorLog };
