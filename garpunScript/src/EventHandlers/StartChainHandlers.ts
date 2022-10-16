import { ApiErrorHandler } from './ApiErrorHandler';
import { Base64Transform } from './Base64Transform';
import { BaseHandler } from './BaseHandler';
import { CameraWatcherEvent } from './CameraWatcherEvent';
import { EventDebounceHandler } from './EventDebounceHandler';
import { FileSizeHandler } from './FileSizeHandler';
import { FileStatHandler } from './FileStatHandler';
import { FileTypeChecker } from './FileTypeChecker';
import { HandleResult } from './HandleResult';
import { SendToApi } from './SendToApi';

export class StartChainHandlers extends BaseHandler {

    constructor(filePath:string, moduleName:string) {
        super();
        this.setHandleResult(new HandleResult(moduleName, filePath));
    }

    async execute() {
        this
            .setNext(new FileStatHandler())
            .setNext(new CameraWatcherEvent())
            .setNext(new EventDebounceHandler())
            .setNext(new FileTypeChecker())
            .setNext(new FileSizeHandler())
            .setNext(new Base64Transform())
            .setNext(new SendToApi())
            .setNext(new ApiErrorHandler());

        await super.execute();
    }
}
