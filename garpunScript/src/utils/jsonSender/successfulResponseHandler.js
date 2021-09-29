const moment = require('moment');
/**
 * @class
 * @description Class for handle response data
 */
class SuccessfulResponseHandler {
    /**
     * @param {object} responseData.
     * @param {number} y - The y value.
     */
    constructor(responseData) {
        this.camera = responseData.camera || '';
        this.fileName = responseData.fileName || '';
        this.sender = responseData.sender;
        this.eventTime = responseData.time;
        this.warningList = responseData.warning;
        this.apiResParsed = this.apiResponseParse(responseData.apiResponse);
    }

    // eslint-disable-next-line class-methods-use-this
    apiResponseParse(apiResponse) {
        return {
            apiResponseTime: apiResponse.datetime || '',
            apiResponseText:
                apiResponse.status || JSON.stringify(apiResponse.error),
        };
    }

    getDelayTime() {
        const { apiResponseTime } = this.apiResParsed;
        if (!apiResponseTime) return '?';
        const eventTime = moment(this.eventTime);
        const apiRespTime = moment(apiResponseTime);
        const delayTimeInMs = apiRespTime - eventTime;
        const minutes = Math.floor(delayTimeInMs / 60000);
        const seconds = ((delayTimeInMs % 60000) / 1000).toFixed(0);
        return `${minutes}m${seconds}s`;
    }

    toPrint() {
        return `${this.sender} camera:${this.camera} photo:${
            this.fileName
        } API_RES:${
            this.apiResParsed.apiResponseText
        } HANDLE_TIME:${this.getDelayTime()}`;
    }
}

module.exports = SuccessfulResponseHandler;
