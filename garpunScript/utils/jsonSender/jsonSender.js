const axios = require('axios');
const appLogger = require('../logger/appLogger');

module.exports = (jsonData) => {
  const config = {
    headers: {
      'Content-type': ' application/json; charset=utf-8',
      Authentication: process.env.API_KEY,
    },
  };
  const url = process.env.API_SERVER;

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
        appLogger.setApiState({
          statusCode: result.status,
          statusMessage: result.statusText,
        });
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
        appLogger.setApiState({
          statusCode: errorMsg.statusCode,
          statusMessage: errorMsg.errorText,
        });
        rejects(errorMsg);
      });
  });
};
