import { AbstractError } from './AbstractError';

export type  EventInfo = {
    senderName:string;
    cameraName:string;
    file:string;
    handleSteps: Array<string>;
    eventIssues: Array<string>;
}

export class EventHandlerError extends AbstractError {
    errorText:string = '';

    statusCode:number| undefined;

    apiURL:string | undefined;

    senderName:string | undefined;

    cameraName:string | undefined;

    fileName:string | undefined;

    handleSteps: Array<string>;

    eventIssues: Array<string>;



    constructor(error:any, props:EventInfo) {
        super(error);
        this.errorText = error.errorText || '';
        this.statusCode = error.statusCode !== 0 ? error.statusCode : '';
        this.apiURL = error.apiURL || '?';
        this.senderName = props.senderName;
        this.cameraName = props.cameraName;
        this.fileName = props.file;
        this.handleSteps = props.handleSteps;
        this.eventIssues = props.eventIssues;

    }

    prepareMsgToPrint() {
        return `[${
            this.senderName
        } API_ERROR] ${`${this.statusCode} ${this.errorText}`} ${
            this.apiURL && `UPL:${this.apiURL}`
        } camera:${this.cameraName} file:${this.fileName} ${this.eventIssuesMsg} ${this.handleStepsMsg}`;
    }

    get handleStepsMsg():string {
        if (this.handleSteps) {
            return `operations:${this.handleSteps.map(stepName => `[${stepName}]`).join(' ')}`;
        }
        return '';
    }

    get eventIssuesMsg():string {
        if (this.eventIssues) {
            return `issues:${this.eventIssues.map(issue => `[${issue}]`).join(' ')}`;
        }
        return '';
    }
}
