const axios = require('axios');

const appConfig = require('../../common/config');
const JsonSenderError = require('../errorHandlers/jsonSenderError');
const AppError = require('../errorHandlers/appError');

module.exports = (jsonData) => {
    const reqConfig = {
        headers: {
            'Content-type': ' application/json; charset=utf-8',
            Authentication: appConfig.API_KEY,
        },
        timeout: appConfig.REQUEST_TIMEOUT,
    };
    const url = appConfig.API_SERVER_URL;
    return new Promise((resolve, rejects) => {
        axios
            .post(url, jsonData, reqConfig)
            .then((response) => {
                const { data, config } = response;
                const { status, error } = data;
                let apiResponse = '';
                let isSent = false;
                if (status && status === 'OK') {
                    isSent = true;
                }
                if (error || status) {
                    apiResponse = data;
                } else {
                    const errorMsg = {
                        config,
                        response: {
                            statusText: 'UNEXPECTED_RES_TYPE',
                            status: 200,
                        },
                    };
                    rejects(new JsonSenderError(errorMsg));
                }
                resolve({ isSent, apiResponse });
            })
            .catch((error) => {
                if (error.isAxiosError) {
                    return rejects(new JsonSenderError(error));
                }
                return rejects(new AppError(error, 'JSON_SENDER'));
            });
    });
};
