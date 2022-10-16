import { AbstractError } from './AbstractError';

export class AppError extends AbstractError {
    emitter:string = '';

    constructor(error:any, emitter:any) {
        super(error);
        this.emitter = error.emitter || emitter;
        this.stack = error.stack;
    }

    prepareMsgToPrint() {
        return JSON.stringify({
            emitter: `[${this.emitter}]`,
            errorMessage: this.message,
            errorStack: this.stack,
        });
    }
}
