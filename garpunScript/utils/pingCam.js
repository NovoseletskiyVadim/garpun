const ping = require('ping');

const hosts = ['192.168.1.1', 'google.com', 'yahoo.com'];
const cameras = {
  test_cam: { address: '10.15.40.18' },
  google: { address: 'google' },
};
Object.keys(cameras).forEach((cam) => {
  cameras[cam].ping = setTimeout(function () {
    console.log('Hello ' + cam);
  }, 3000);
});

const CameraAlive = (camera) => {
  clearTimeout(cameras[camera].ping);
  cameras[camera].ping = setTimeout(function () {
    console.log('Hello ' + camera);
  }, 3000);
};

CameraAlive('test_cam');
CameraAlive('test_cam');

// var cfg = {
//   timeout: 20000,
//   // WARNING: -i 2 may not work in other platform like window
//   // extra: ['-i', '2'],
// };

// hosts.forEach(function (host) {
//   ping.sys.probe(host, function (isAlive) {
//     var msg = isAlive
//       ? 'host ' + host + ' is alive'
//       : 'host ' + host + ' is dead';
//     console.log(msg);
//   });
// }, cfg);
