import { BaseHandler } from './BaseHandler';
import { FileStatHandler } from './FileStatHandler';
import { FileTypeChecker } from './FileTypeChecker';
import { HandleResult } from './HandleResult';

export class StartChainHandlers extends BaseHandler {

    constructor(filePath:string, moduleName:string) {
        super(filePath, moduleName);
        this.handleResult = new HandleResult(moduleName)
    }

    execute() {
        this
            .setNext(new FileStatHandler(this.filePath))
            .setNext(new FileTypeChecker(this.filePath));
       super.execute(this.handleResult);
    }
}
