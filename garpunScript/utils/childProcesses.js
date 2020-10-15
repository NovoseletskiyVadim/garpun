const { fork } = require('child_process');

const camerasWatcher = fork(`./utils/camerasWatcher`);
const rejectApiHandler = fork(`./utils/rejectApiHandler.js`);

module.exports = {
  camerasWatcher,
  rejectApiHandler,
};
