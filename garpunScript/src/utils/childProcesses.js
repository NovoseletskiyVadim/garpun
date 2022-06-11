const { fork } = require('child_process');

// const camerasWatcher = fork('./src/utils/camerasWatcherProcess');
const rejectApiHandler = fork('./src/utils/jsonResenderProcess/index.js');

module.exports = {
    // camerasWatcher,
    rejectApiHandler,
};
