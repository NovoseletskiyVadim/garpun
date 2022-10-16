import fs from 'fs';
import path from 'path';

import appConfig from '../common/config';

if (!fs.existsSync(path.join(__dirname, appConfig.LOG_PATH))) {
    fs.mkdirSync(path.join(__dirname, appConfig.LOG_PATH));
}

const appErrorLog = (eventData) => {
    const { message } = eventData;
    const stream = fs.createWriteStream(
        path.join(__dirname, `${appConfig.LOG_PATH}/error.log`),
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

export default appErrorLog;
