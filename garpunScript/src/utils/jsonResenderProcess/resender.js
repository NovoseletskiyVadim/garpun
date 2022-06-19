const { cashReqDbConnection } = require('../../db/dbConnect');

const jsonSender = require('../jsonSender/jsonSender');
const SuccessfulResponseHandler = require('../jsonSender/successfulResponseHandler');
const PendingList = require('../../models/pendingList');
// const CamEvents = require('../../models/camEvent');
const { printLog } = require('../logger/appLogger');
const {
    JsonSenderError,
    AppError,
    EventHandlerError,
} = require('../errorHandlers');

const MODULE_NAME = 'RESENDER_A';
const COUNT_ROW_AFTER_ATTEMPTS = 100;

/**
 * @function
 * @description This function counts oh the request query to the API. 
 * @returns Promise<number>
 */
const requestQueryCount = () => {
    const requestMaxID = cashReqDbConnection.query('SELECT MAX(ID) as max  FROM pendingLists');
    const requestMinID = cashReqDbConnection.query('SELECT MIN(ID) as min  FROM pendingLists');
    return Promise.all([requestMaxID, requestMinID]).then((requestsResult)=>{
        const [queryResultMaxId,  queryResultMinId ] = requestsResult;
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
 * @property {number|null} count True if the token is valid.
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

module.exports = (limitToResend, countAttempt) => {
    const finalResult = {};


    return PendingList.findAll({ limit: limitToResend })
        .then(result => {
        
            if (countAttempt % COUNT_ROW_AFTER_ATTEMPTS === 0) {

                return requestQueryCount().then(count => ({count, rows: result}));

            }

            return {count: null, rows: result };
        } )
        .then((result) => {
            const { count, rows } = result;
            finalResult.count = count;

            if (rows.length === 0) {
                finalResult.count = 0;
                return finalResult;
            }

            const logMessage = `[RESENDER-${countAttempt} START]${(count ? ` WAITING_REQUESTS_COUNT: ${count} `: ' ')}REQUEST_LIMIT: ${
                limitToResend
            }`;
            printLog(logMessage).warning();

            const preparedRequests = rows.map(
                (item) =>
                    new Promise((resolve, reject) => {
                        jsonSender(item.data)
                            .then((apiResp) => {
                                const { isSent, apiResponse } = apiResp;

                                const deleteFromPendingList =
                                    PendingList.destroy({
                                        where: {
                                            id: item.id,
                                        },
                                    });

                                // const updateCamEvent = CamEvents.findOne({
                                //     where: {
                                //         id: item.dbID,
                                //     },
                                // }).then((camEvent) => {
                                //     if (camEvent) {
                                //         return camEvent.update({
                                //             uploaded: isSent,
                                //             apiResponse,
                                //         });
                                //     }
                                //     throw new Error(
                                //         `CamEvent ID: ${item.dbID} not found`
                                //     );
                                // });

                                return Promise.all([
                                    deleteFromPendingList,
                                    // updateCamEvent,
                                ])
                                    .then(() => {
                                        const eventData = {};
                                        eventData.sender = `[${MODULE_NAME}-${countAttempt}]`;
                                        eventData.cameraName = item.fileMeta ? item.fileMeta.cameraName : '?';
                                        eventData.fileName = item.fileMeta ? item.fileMeta.file.name + item.fileMeta.file.ext : '?';
                                        eventData.eventTime = item.fileMeta ? item.fileMeta.eventDate: '?';
                                        eventData.apiResponse = apiResponse;
                                        const logData = printLog(
                                            new SuccessfulResponseHandler(
                                                eventData
                                            ).toPrint()
                                        );
                                        
                                        if (
                                            !isSent
                                        ) {
                                            logData.warning();
                                        } else {
                                            logData.successful();
                                        }

                                        return resolve(eventData);
                                    });
                            })
                            .catch((error) => {
                                if (error instanceof JsonSenderError) {
                                    printLog(
                                        new EventHandlerError(error, {
                                            senderName: `${MODULE_NAME}-${countAttempt}`,
                                            fileMeta: item.fileMeta,
                                        })
                                    ).errorSecond();
                                } else {
                                    printLog(
                                        new AppError(
                                            error,
                                            MODULE_NAME
                                        )
                                    ).error();
                                }
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
            printLog(new AppError(error, MODULE_NAME)).error();
        });
};
