/**
 * Class for handling app error
 * @param {Erorr} error
 *  @param {string} emitter
 */
class AppError extends Error {
    constructor(error, emitter) {
        super(error);
        this.emitter = error.emitter || emitter;
        this.stack = error.stack;
    }

    toPrint() {
        return JSON.stringify({
            emitter: `[${this.emitter}]`,
            errorMessage: this.message,
            errorStack: this.stack,
        });
    }
}

module.exports = AppError;
