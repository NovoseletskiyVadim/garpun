const axios = require('axios');
const appLogger = require('../logger/appLogger');

const REQUEST_TIMEOUT = process.env.REQUEST_TIMEOUT || 30000;

module.exports = (jsonData) => {
  const config = {
    headers: {
      'Content-type': ' application/json; charset=utf-8',
      Authentication: process.env.API_KEY,
    },
    timeout: REQUEST_TIMEOUT,
  };
  const url = process.env.API_SERVER_URL;
  return new Promise((resolve, rejects) => {
    axios
      .post(url, jsonData, config)
      .then((result) => {
        const { status, error } = result.data;
        let apiResponse = '';
        let isSent = false;
        if (status && status === 'OK') {
          isSent = true;
        }
        if (error || status) {
          apiResponse = result.data;
        } else {
          const errorMsg = {
            errorText: 'UNEXPECTED_RES_TYPE',
            statusCode: 200,
            apiURL: url,
          };
          rejects(errorMsg);
        }
        resolve({ isSent, apiResponse });
      })
      .catch((error) => {
        const errorMsg = {
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
