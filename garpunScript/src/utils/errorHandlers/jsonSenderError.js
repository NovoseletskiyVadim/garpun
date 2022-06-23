const AbstractErrorLogEvent = require('./AbstractErrorLogEvent');
/**
 * @class JsonSenderError
 */
class JsonSenderError extends AbstractErrorLogEvent {
    constructor(error) {
        super(error);
        this.response = error.response;
        this.isAxiosError = error.isAxiosError;
        this.errorText = this.message;
        this.statusCode = 0;
        this.apiURL = error.config ? error.config.url : '';
        this.prepareData();
    }

    prepareData() {
        if (this.response) {
            this.errorText = this.response.statusText;
            this.statusCode = this.response.status;
        }
    }

    PrepareMsgToPrint() {
        return {
            errorText: this.errorText,
            statusCode: this.statusCode,
            apiURL: this.apiURL,
        };
    }
}

module.exports = JsonSenderError;
