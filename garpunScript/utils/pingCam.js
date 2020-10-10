'use strict';
const ping = require('ping');
const { models } = require('./../db/dbConnect').sequelize;

process.send(`PingCam started ID:${process.pid}`);
const timeOut = process.env.TIME_TO_CHECK_CAMERAS;
const pingCam = (camera, timeOut, recursive) => {
  camera.ping = setTimeout(function () {
    ping.sys.probe(camera.cameraIP, (isAlive) => {
      if (!isAlive) {
        console.log('\x1b[31m%s\x1b[0m', `DEAD_CAMERA ${camera.ftpHomeDir}`);
      }
    });
    if (recursive) {
      pingCam(camera, timeOut, true);
    }
  }, timeOut);
};

let cameras = [];

models.cameras
  .findAll({ where: { isOnLine: true }, raw: true })
  .then((camerasList) => {
    let workingCam = '';
    cameras = camerasList.map((cam) => {
      workingCam += ` ${cam.ftpHomeDir}`;
      pingCam(cam, timeOut, true);
      return cam;
    });
    console.log(`WORKING_CAMERAS: ${workingCam}`);
    process.on('message', (camName) => {
      cameraAlive(camName);
    });
  });

const cameraAlive = (camera) => {
  const cameraIndex = cameras.findIndex((cam) => {
    if (cam.ftpHomeDir === camera) {
      return true;
    }
  });
  if (cameraIndex >= 0) {
    clearTimeout(cameras[cameraIndex].ping);
    pingCam(cameras[cameraIndex], timeOut, true);
  }
};

module.exports = { pingCam };
