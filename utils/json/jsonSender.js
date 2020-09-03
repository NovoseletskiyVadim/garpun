'use strict';
const axios = require('axios');

module.exports = (jsonData) => {
  const config = {
    headers: {
      'Content-type': ' application/json; charset=utf-8',
      Authentication: process.env.API_KEY, //
    },
  };
  return new Promise((resolve, rejects) => {
    axios
      .post(
        process.env.API_SERVER + '/CollectMoveVehicles/ReceiveMovementHarpoon',
        jsonData,
        config
      )
      .then((res) => {
        resolve(true);
      })
      .catch((err) => {
        rejects(err);
      });
  });
};
