const { v4: uuidv4 } = require('uuid');

const { base64Convertor } = require('../fileExplorer/fileExplorer');
const Cameras = require('../../models/cameras');

const appLogger = require('../logger/appLogger');
const logTypes = require('../logger/logTypes');

module.exports = (eventData) => {
  return new Promise((resolve, reject) => {
    const dataBase64 = base64Convertor(eventData);
    const cameraInfo = Cameras.findOne({
      where: { ftpHomeDir: eventData.cameraName },
    });
    Promise.all([dataBase64, cameraInfo])
      .then((result) => {
        const [dataBase64, cameraInfo] = result;
        if (!Boolean(cameraInfo)) {
          return reject(new Error(`CAMERA ${eventData.cameraName} NOT_EXIST`));
        }
        let cameraPosition = {
          lat: '',
          long: '',
        };
        try {
          const arrayPosition = cameraInfo.position.split(',');
          cameraPosition = {
            lat: parseFloat(arrayPosition[0]),
            long: parseFloat(arrayPosition[1]),
          };
        } catch (error) {
          return reject(
            new Error(`CAMERA ${eventData.cameraName} POSITION_ERROR ${error}`)
          );
        }
        const eventObject = {
          version: 1,
          provider:
            process.env.PROVIDER || reject(new Error(`PROVIDER is not set`)),
          data: {
            device: {
              id:
                cameraInfo.uuid || reject(new Error(`camera UUID is not set`)),
              name:
                cameraInfo.name || reject(new Error(`camera NAME Is not set`)),
            },
            event: {
              id: eventData.uuid,
              datetime: eventData.datetime,
              latitude: cameraPosition.lat,
              longitude: cameraPosition.long,
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
                  id: uuidv4(),
                  data: dataBase64,
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
        appLogger.printLog(logTypes.APP_ERROR, {
          errorType: 'JSON_CREATOR_ERROR',
          errorData: err,
        });
        reject(err);
      });
  });
};
