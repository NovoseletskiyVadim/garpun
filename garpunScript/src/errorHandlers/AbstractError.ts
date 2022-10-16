import { AbstractLogEvent } from '../logger/AbstractLogEvent';

export abstract class AbstractError extends Error implements AbstractLogEvent {
    abstract prepareMsgToPrint(): string
}
