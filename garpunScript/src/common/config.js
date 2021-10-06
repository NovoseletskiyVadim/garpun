require('dotenv').config({ path: './.env' });

const {
    MEDIA_PATH,
    TRASH_DIR,
    ARCHIVE_DIR,
    API_SERVER_URL,
    API_KEY,
    PROVIDER,
    MAIN_DB_PATH,
    TEMP_DB_PATH,
    TIMEOUT_CAMERA_OFF_ALERT,
    ARCHIVE_DAYS,
    TRASH_ARCHIVE_DAYS,
    MAX_FILE_SIZE,
    BOT_TOKEN,
    MAX_REQUESTS_COUNT,
    REQUEST_TIMEOUT,
    SEND_PACKAGE_TIMEOUT,
    LOG_PATH,
    USER_LIST,
    TASK_SCHEDULER_GET_STAT,
    TASK_SCHEDULER_SEND_STAT,
} = process.env;

if (!BOT_TOKEN) {
    throw new Error('[CONFIG] Set bot token');
}

const setBotUserList = (userList) => {
    if (userList) {
        return userList.split(',');
    }
    return [];
};

module.exports = {
    MEDIA_PATH: MEDIA_PATH || './MEDIA_PATH',
    TRASH_DIR: TRASH_DIR || './TRASH_DIR',
    ARCHIVE_DIR: ARCHIVE_DIR || './ARCHIVE_DIR',
    API_SERVER_URL: API_SERVER_URL || 'http://localhost:3000',
    API_KEY: API_KEY || 'test',
    PROVIDER: PROVIDER || 'test-provider',
    MAIN_DB_PATH,
    TEMP_DB_PATH,
    TIMEOUT_CAMERA_OFF_ALERT: TIMEOUT_CAMERA_OFF_ALERT || 3600000,
    ARCHIVE_DAYS: parseInt(ARCHIVE_DAYS, 10) || 0,
    TRASH_ARCHIVE_DAYS: parseInt(TRASH_ARCHIVE_DAYS, 10) || 0,
    MAX_FILE_SIZE: parseInt(MAX_FILE_SIZE, 10) || 250000,
    BOT_TOKEN,
    MAX_REQUESTS_COUNT: parseInt(MAX_REQUESTS_COUNT, 10) || 50,
    REQUEST_TIMEOUT: REQUEST_TIMEOUT || 1000,
    SEND_PACKAGE_TIMEOUT: SEND_PACKAGE_TIMEOUT || 5000,
    LOG_PATH: LOG_PATH || './LOG_PATH',
    USER_LIST: setBotUserList(USER_LIST),
    TASK_SCHEDULER_GET_STAT: TASK_SCHEDULER_GET_STAT || '0 3 * * *',
    TASK_SCHEDULER_SEND_STAT: TASK_SCHEDULER_SEND_STAT || '0 9 * * *',
};
