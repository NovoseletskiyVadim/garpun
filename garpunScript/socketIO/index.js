const io = require('socket.io')();
const { camerasWatcher } = require('./../utils/childProcesses');

let activeUsers = {};

module.exports = {
  socketStart: () => {
    const options = {
      pingInterval: 10000,
      pingTimeout: 5000,
      cookie: false,
    };

    io.on('connection', (socket) => {
      activeSockets = socket;
      const address = socket.handshake.headers.host;
      activeUsers[socket.id] = {};
      console.log('WEB_USER_CONNECTED_FROM: ' + address);
      socket.on('setCamerasFilter', (cameraName) => {
        if (Array.isArray(cameraName)) {
          activeUsers[socket.id].camerasFilter = [...cameraName];
        }
      });
      socket.on('disconnect', (reason) => {
        delete activeUsers[socket.id];
      });
    });

    camerasWatcher.on('message', (msg) => {
      io.emit('cam-status', msg);
    });

    io.listen(process.env.SOCKET_PORT, options);
  },

  newEvent: (msgData) => {
    if (Object.keys(activeUsers).length) {
      Object.keys(activeUsers).forEach((user) => {
        if (
          activeUsers[user].camerasFilter &&
          activeUsers[user].camerasFilter.indexOf(msgData.cameraName) >= 0
        ) {
          io.to(user).emit('get-event', msgData);
        }
      });
    }
  },

  apiResp: (msgData) => {
    if (Object.keys(activeUsers).length) {
      Object.keys(activeUsers).forEach((user) => {
        if (
          activeUsers[user].camerasFilter &&
          user.camerasFilter.indexOf(msgData.cameraName) >= 0
        ) {
          io.to(user).emit('api-res', msgData);
        }
      });
    }
  },
};
