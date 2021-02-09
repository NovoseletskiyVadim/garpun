const { fork } = require('child_process');

const camerasWatcher = fork(`./utils/camerasWatcherProcess`);
const rejectApiHandler = fork(`./utils/jsonResenderProcess`);

module.exports = {
  camerasWatcher,
  rejectApiHandler,
};
