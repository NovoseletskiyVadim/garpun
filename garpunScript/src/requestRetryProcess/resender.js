// eslint-disable-next-line import/no-import-module-exports
// const { CamEventModel }  = require('../../models/camEvent');
// eslint-disable-next-line import/no-import-module-exports
import { AxiosError } from 'axios';

import { CamEventModel } from '../models/camEvent';
import { cashReqDbConnection } from '../db/dbConnect';
import { ApiConnector } from  '../apiConnector/ApiConnector';
import { appLogger } from '../logger/appLogger';

const SuccessfulResponseHandler = require('../apiConnector/SuccessfulResponseHandler');
const { PendingEventModel } = require('../models/pendingEvent');

const {
    JsonSenderError,
    AppError,
    EventHandlerError,
} = require('../errorHandlers');


const MODULE_NAME = 'RESENDER';
const COUNT_ROW_AFTER_ATTEMPTS = 100;

const requestQueryCount = () => {
    const requestMaxID = cashReqDbConnection.query('SELECT MAX(ID) as max  FROM pendingLists');
    const requestMinID = cashReqDbConnection.query('SELECT MIN(ID) as min  FROM pendingLists');
    return Promise.all([requestMaxID, requestMinID]).then((requestsResult) => {
        const [queryResultMaxId,  queryResultMinId] = requestsResult;
        const queryValueMax = queryResultMaxId[0];
        const queryValueMin = queryResultMinId[0];
        const { max: maxId } = queryValueMax[0];
        const { min: minId } = queryValueMin[0];
        const count = maxId - minId + 1;
        return count;
    });
};
/**
 * @typedef ResultREsender
 * @property {number | null} count True if the token is valid.
 * @property {Array} sentList The list of result sending to the API.
 */

/**
 * @module resender
 * @function
 * @description This function gets from db the count of total pending requests and requests data by the limit.
 * After trying to send to the API.
 * If the request is successfully sent, the data is deleted from the cash db
 * and in the main db for the event with id  ===  requests.dbID  add response data from the api.
 * If api not sent nothing to do with request
 * @param {number} limitToResend Limit requests to the API
 * @returns {Promise<ResultREsender>} result
 * @returns {Promise<ResultREsender>} result.count
 * @returns {Promise<ResultREsender>} result.sentList
 */

export const resender = (limitToResend, countAttempt) => {
    const finalResult = {};
    return PendingEventModel.findAll({ limit: limitToResend })
        .then(result => {
            if (countAttempt % COUNT_ROW_AFTER_ATTEMPTS === 0) {
                return requestQueryCount().then(count => ({ count, rows: result }));
            }

            return { count: null, rows: result };
        })
        .then((result) => {
            const { count, rows } = result;
            finalResult.count = count;
            if (rows.length === 0) {
                finalResult.count = 0;
                return finalResult;
            }
            const logMessage = `[RESENDER-${countAttempt} START]${(count ? ` WAITING_REQUESTS_COUNT: ${count} ` : ' ')}REQUEST_LIMIT: ${
                limitToResend
            }`;
            appLogger.setLogMessage(logMessage).warning();
            const preparedRequests = rows.map(
                (item) =>
                    new Promise((resolve, reject) => {
                        new ApiConnector(item.data)
                            .sendData()
                            .then((apiResp) => {
                                const { isSent, apiResponse } = apiResp;

                                const deleteFromPendingList = PendingEventModel.destroy({
                                    where: {
                                        id: item.id,
                                    },
                                });

                                const updateCamEvent = CamEventModel.findOne({
                                    where: {
                                        id: item.dbID,
                                    },
                                }).then((camEvent) => {
                                    if (camEvent) {
                                        return camEvent.update({
                                            uploaded: isSent,
                                            apiResponse: JSON.stringify(apiResponse),
                                        });
                                    }
                                    throw new Error(
                                        `CamEvent ID: ${item.dbID} not found`
                                    );
                                });

                                return Promise.all([
                                    deleteFromPendingList,
                                    updateCamEvent,
                                ])
                                .then((deleteUpdateResults) => {
                                    const eventData = deleteUpdateResults[1].dataValues;
                                    eventData.sender = `[${MODULE_NAME}-${countAttempt}]`;
                                    const logData = appLogger.setLogMessage(
                                        new SuccessfulResponseHandler(
                                            eventData
                                        ).toPrint()
                                    );

                                    if (
                                        !eventData.uploaded || eventData.fileErrors.length
                                    ) {
                                        logData.warning();
                                    } else {
                                        logData.successful();
                                    }

                                    resolve(eventData);
                                });
                        })

                            .catch((error) => {
                                let apiError = null;

                                if (error instanceof JsonSenderError) {
                                    apiError = error;
                                }

                                if (error instanceof AxiosError) {
                                    apiError = new JsonSenderError(error);
                                }

                                if (apiError) {
                                    appLogger.setLogMessage(
                                        new EventHandlerError(apiError, {
                                            senderName: MODULE_NAME,
                                            cameraName: item.fileMeta.cameraName,
                                            file: item.fileMeta.file
                                        })
                                    ).errorSecond();
                                }
                                // if (error instanceof JsonSenderError) {
                                //     appLogger.setLogMessage(
                                //         new EventHandlerError(error, {
                                //             senderName: `${MODULE_NAME}-${countAttempt}`,
                                //             fileMeta: item.fileMeta,
                                //         })
                                //     ).errorSecond();
                                // } else {
                                //     appLogger.setLogMessage(
                                //         new AppError(
                                //             error,
                                //             MODULE_NAME
                                //         )
                                //     ).error();
                                // }
                                reject(error);
                            });
                    })
            );
            return Promise.allSettled(preparedRequests).then((reqResults) => {
                finalResult.sentList = reqResults;
                return finalResult;
            });
        })
        .catch((error) => {
            appLogger.setLogMessage(new AppError(error, MODULE_NAME)).error();
        });
};
