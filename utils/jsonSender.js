'use strict';
const url = require('url');
const axios = require('axios');
const { resolve } = require('path');
const { rejects } = require('assert');

module.exports = (eventData) => {
  let jsonData = {
    version: 1,
    provider: process.env.PROVIDER || '', //Назва поставника послуги ?
    data: {
      device: {
        id: '', //Унікальний ідентифікатор СРНЗ в ІПНП. Ідентифікатор видається при реєстрації
        name: eventData.cameraName, //Назва СРНЗ
        event: {
          id: eventData.uuid,
          datetime: eventData.formattedDate,
          latitude: 0, //?
          longitude: 0, //?
          params: [],
          vehicle: {
            licensePlate: {
              value: eventData.plateNumber,
              country: null,
              region: null,
            },
            params: [],
          },
          media: [
            {
              id: '', //?
              data: '', //eventData.fileData, //Фотозображення ТЗ* Строка (base64)
              url: null,
              plate: {
                data: null,
                url: null,
              },
            },
          ],
        },
      },
    },
  };
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
        JSON.stringify(jsonData),
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
