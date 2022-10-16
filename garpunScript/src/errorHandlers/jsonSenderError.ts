import { AbstractError } from './AbstractError';

/**
 * @class JsonSenderError
 */
export class JsonSenderError extends AbstractError {
    response: Record<string, any>;

    isAxiosError: boolean = false;

    errorText:string|undefined;

    statusCode:number = 0;

    apiURL:string|undefined;

    constructor(error:any) {
        super(error);
        this.response = error.response;
        this.isAxiosError = error.isAxiosError;
        this.errorText = this.message;
        this.apiURL = error.config ? error.config.url : '';
        this.prepareData();
    }

    prepareData() {
        if (this.response) {
            this.errorText = this.response.statusText;
            this.statusCode = this.response.status;
        }
    }

    prepareMsgToPrint():any {
        return {
            errorText: this.errorText,
            statusCode: this.statusCode,
            apiURL: this.apiURL,
        };
    }
}
