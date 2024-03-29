const fs = require('fs');
const path = require('path');

const config = require('../../common/config');

if (!fs.existsSync(path.join(__dirname, config.LOG_PATH))) {
    fs.mkdirSync(path.join(__dirname, config.LOG_PATH));
}

const appErrorLog = (eventData) => {
    const { message } = eventData;
    const stream = fs.createWriteStream(
        path.join(__dirname, `${config.LOG_PATH}/error.log`),
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

module.exports = { appErrorLog };
