'use strict';
const path = require('path');

const moment = require('moment');
const { v4: uuidv4 } = require('uuid');
const { CamEvent, PendingList } = require('./../db/dbConnect');
const jsonSender = require('./jsonSender');
const jsonCreator = require('./jsonCreator');

const rejectFileHandler = require('./rejectFileHandler');

module.exports = (fileMeta) => {
  const { uuid, eventDate, cameraName, plateNumber, file } = fileMeta;
  const dataToLocalDB = {
    uuid: uuid,
    time: eventDate,
    license_plate_number: plateNumber,
    camera: cameraName,
  };

  jsonCreator({
    cameraName,
    plateNumber,
    eventDate,
    uuid,
    pathFile: file.fullPath,
  })
    .then((jsonToSend) => {
      jsonSender(jsonToSend)
        .then((result) => {
          if (result) {
            dataToLocalDB.uploaded = true;
          }
          CamEvent.create(dataToLocalDB);
        })
        .catch((err) => {
          const status = 'REQUEST_REJECTED';
          PendingList.create({
            status,
            data: jsonToSend,
            dbID: dataToLocalDB.uuid,
          });
          CamEvent.create(dataToLocalDB);
          console.log('REQUEST_REJECTED', err.message);
        });
    })
    .catch((err) => {
      console.error('file', err);
    });
};
