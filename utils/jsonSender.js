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
          fs.unlinkSync(fileMeta.file.fullPath);
        } else {
          // status 200 with error
          // TODO  All type API ERROR response?
          console.log('JSON_NOT_VALID');
          rejectFileHandler(fileMeta);
        }
        resolve({ apiResponse, uploaded });
      })
      .catch((err) => {
        rejects(err);
      });
  });
};
