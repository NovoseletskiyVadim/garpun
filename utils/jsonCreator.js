'use strict';
const base64Convertor = require('./base64Convertor');
const { models } = require('./../db/dbConnect').sequelize;
const { v4: uuidv4 } = require('uuid');

module.exports = (eventData) => {
  return new Promise((resolve, reject) => {
    const dataBase64 = base64Convertor(eventData.pathFile);
    const cameraInfo = models.cameras.findOne({
      where: { ftpHomeDir: eventData.cameraName },
    });
    Promise.all([dataBase64, cameraInfo])
      .then((result) => {
        const [dataBase64, cameraInfo] = result;
        const eventObject = {
          version: 1,
          provider: process.env.PROVIDER || '', //Назва поставника послуги ?
          data: {
            device: {
              id: cameraInfo.uuid, //Унікальний ідентифікатор СРНЗ в ІПНП. Ідентифікатор видається при реєстрації
              name: cameraInfo.name, //Назва СРНЗ
            },
            event: {
              id: eventData.uuid,
              datetime: eventData.datetime,
              latitude: parseFloat(cameraInfo.position.split(',')[0]), //?
              longitude: parseFloat(cameraInfo.position.split(',')[1]), //?
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
                  id: uuidv4(), //?
                  data: dataBase64, //Фотозображення ТЗ* Строка (base64)
                  url: null,
                  plate: {
                    data: null,
                    url: null,
                  },
                },
              ],
            },
          },
        };
        resolve(JSON.stringify(eventObject));
      })
      .catch((err) => {
        console.error('JSON_CREATOR_ERROR', err);
        reject(err);
      });
  });
};
