'use strict';
const axios = require('axios');

module.exports = (jsonData) => {
  const config = {
    headers: {
      'Content-type': ' application/json; charset=utf-8',
      Authentication: process.env.API_KEY,
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
        let isSent = false;
        if (status && status === 'OK') {
          isSent = true;
        }
        resolve({ isSent, apiResponse });
      })
      .catch((error) => {
        let errorMsg = {
          errorText: '',
          statusCode: 0,
          apiURL: url,
        };
        if (error.response) {
          errorMsg.errorText = error.response.statusText || error.message;
          errorMsg.statusCode = error.response.status;
        } else {
          errorMsg.errorText = error.message;
        }
        rejects(errorMsg);
      });
  });
};
