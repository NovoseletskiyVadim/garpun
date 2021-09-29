const { v4: uuidv4 } = require('uuid');

const { base64Convertor } = require('../fileExplorer/fileExplorer');
const Cameras = require('../../models/cameras');

const { printLog } = require('../logger/appLogger');
const { AppError } = require('../errorHandlers');

module.exports = (eventData) =>
    new Promise((resolve, reject) => {
        const data = base64Convertor(eventData);
        const camera = Cameras.findOne({
            where: { ftpHomeDir: eventData.cameraName },
        });
        Promise.all([data, camera])
            .then((result) => {
                const [dataBase64, cameraInfo] = result;
                if (!cameraInfo) {
                    return reject(
                        new Error(
                            `CAMERA_INFO ${eventData.cameraName} NOT_EXIST`
                        )
                    );
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
                        new Error(
                            `CAMERA_INFO ${eventData.cameraName} POSITION_ERROR ${error}`
                        )
                    );
                }
                const eventObject = {
                    version: 1,
                    provider:
                        process.env.PROVIDER ||
                        reject(new Error('PROVIDER is not set')),
                    data: {
                        device: {
                            id:
                                cameraInfo.uuid ||
                                reject(
                                    new Error(
                                        `CAMERA_INFO ${eventData.cameraName} UUID is not set`
                                    )
                                ),
                            name:
                                cameraInfo.name ||
                                reject(
                                    new Error(
                                        `CAMERA_INFO ${eventData.cameraName} NAME is not set`
                                    )
                                ),
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
                return resolve(JSON.stringify(eventObject));
            })
            .catch((err) => {
                printLog(
                    new AppError(err, 'JSON_CREATOR_ERROR').toPrint()
                ).error();
                reject(err);
            });
    });
