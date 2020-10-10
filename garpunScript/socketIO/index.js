const io = require('socket.io')();

module.exports = {
  socketStart: () => {
    const options = {
      pingInterval: 10000,
      pingTimeout: 5000,
      cookie: false,
    };

    io.on('connection', (socket) => {
      const address = socket.handshake.headers.host;
      console.log('WEB_USER_CONNECTED_FROM: ' + address);
    });

    io.listen(process.env.SOCKET_PORT, options);
  },
  newEvent: (msgData) => {
    io.emit('get-event', msgData);
  },
  apiResp: (msgData) => {
    io.emit('api-res', msgData);
  },
};
