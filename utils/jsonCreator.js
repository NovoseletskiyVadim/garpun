const base64Convertor = require('./base64Convertor');
module.exports = (eventData) => {
  return new Promise((resolve, reject) => {
    base64Convertor(eventData.pathFile)
      .then((dataBase64) => {
        const eventObject = {
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
                    data: 'qqqqqqqq', //dataBase64, //Фотозображення ТЗ* Строка (base64)
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
        resolve(JSON.stringify(eventObject));
      })
      .catch(reject);
  });
};
