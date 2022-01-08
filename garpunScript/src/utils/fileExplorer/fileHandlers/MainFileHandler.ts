import { BaseHandler } from './BaseHandler';
import { FileStatHandler } from './FileStatHandler';
import { FileTypeChecker } from './FileTypeChecker';

export class MainFileHandler extends BaseHandler {
    filePath = '';

    constructor(filePath: string) {
        super();
        this.filePath = filePath;
    }

    execute() {
        this.setNext(new FileStatHandler(this.filePath)).setNext(
            new FileTypeChecker(this.filePath)
        );
        this.next?.execute();
    }
}
