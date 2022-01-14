const AbstractErrorLogEvent = require('./AbstractErrorLogEvent');

class AppError extends AbstractErrorLogEvent {
    constructor(error, emitter) {
        super(error);
        this.emitter = error.emitter || emitter;
        this.stack = error.stack;
    }

    PrepareMsgToPrint() {
        return JSON.stringify({
            emitter: `[${this.emitter}]`,
            errorMessage: this.message,
            errorStack: this.stack,
        });
    }
}

module.exports = AppError;

