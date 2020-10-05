'use strict';
const axios = require('axios');
const fs = require('fs');
const rejectFileHandler = require('./rejectFileHandler');

module.exports = (jsonData, fileMeta) => {
  const config = {
    headers: {
      'Content-type': ' application/json; charset=utf-8',
      Authentication: process.env.API_KEY, //
    },
  };
  const url =
    process.env.API_SERVER + '/CollectMoveVehicles/ReceiveMovementHarpoon';

  return new Promise((resolve, rejects) => {
    axios
      .post(url, jsonData, config)
      .then((result) => {
        const { status } = result.data;
        const apiResponse = result.data;
        let uploaded = false;
        if (status && status === 'OK') {
          uploaded = true;
          resolve({ apiResponse, uploaded });
          // fs.unlink(fileMeta.file.fullPath, (err) => {
          //   if (err) throw err;
          //
          // });
        } else {
          // status 200 with error
          // TODO  All type API ERROR response?
          rejectFileHandler(fileMeta).then(() => {
            resolve({ apiResponse, uploaded });
          });
        }
      })
      .catch((err) => {
        rejects(err);
      });
  });
};
