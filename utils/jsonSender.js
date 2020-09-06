'use strict';
const axios = require('axios');

module.exports = (jsonData) => {
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
      .then((res) => {
        resolve(res);
      })
      .catch((err) => {
        rejects(err);
      });
  });
};
