import moment from 'moment';
import { AbstractLogEvent } from '../logger/AbstractLogEvent';


interface ISuccessfulResponseHandler {
    camera: string;
    fileName: string;
    sender: string;
    eventTime: string | null;
    warning: Array<string>;
    apiResponse: any;
    operations: Array<string>;
}

/**
 * @class
 * @description Class for handle response data
 */
export class SuccessfulResponseHandler extends AbstractLogEvent {
    private camera: string;

    private fileName :string;

    private sender: string;

    private eventTime: string;

    private warningList: Array<string>;

    private operations: Array<string>;

    apiResParsed: {
        apiResponseTime: string | undefined;
        apiResponseText: string;
    };

    /**
     * @param {object} responseData.
     * @param {number} y - The y value.
     */
    constructor(responseData:ISuccessfulResponseHandler) {
        super();
        this.camera = responseData.camera || '';
        this.fileName = responseData.fileName || '';
        this.sender = responseData.sender;
        this.eventTime = responseData.eventTime || '';
        this.warningList = responseData.warning;
        this.apiResParsed = this.apiResponseParse(responseData.apiResponse);
        this.operations = responseData.operations;
    }

    // eslint-disable-next-line class-methods-use-this
    private apiResponseParse(apiResponse) {
        return {
            apiResponseTime: apiResponse.datetime || '',
            apiResponseText:
                apiResponse.status || JSON.stringify(apiResponse.error),
        };
    }

    private getDelayTime():string {
        const { apiResponseTime } = this.apiResParsed;
        if (!apiResponseTime) return '?';
        const eventTime = moment(this.eventTime);
        const apiRespTime = moment(apiResponseTime);
        if (eventTime.isValid() && apiRespTime.isValid()) {
            const delayTimeInMs = apiRespTime.unix() - eventTime.unix();
            const minutes = Math.floor(delayTimeInMs / 60000);
            const seconds = ((delayTimeInMs % 60000) / 1000).toFixed(0);
            return `${minutes}m${seconds}s`;
        }
        return '?';
    }

    get operationsStepsMsg():string {
        if (this.operations) {
            return ` operations:${this.operations.map(stepName => `[${stepName}]`).join(' ')}`;
        }
        return '';
    }

    prepareMsgToPrint():string {
        return `[${this.sender}] camera:${this.camera} file:${
            this.fileName
        } API_RES:${
            this.apiResParsed.apiResponseText
        } HANDLE_TIME:${this.getDelayTime()}${this.operationsStepsMsg}`;
    }
}
