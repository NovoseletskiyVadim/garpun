import FileType from 'file-type';
import { BaseHandler, FileHandleResult } from './BaseHandler';
import config from './FileStatHandler.config.json';

export class FileTypeChecker extends BaseHandler {
    filePath = '';

    constructor(filePath: string) {
        super();
        this.filePath = filePath;
    }

    async execute(previousResult?: FileHandleResult) {
        if (previousResult) {
            this.result = previousResult;
        }
        const fileType = await FileType.fromFile(this.filePath);
        if (!fileType || fileType.ext === config.fileType) {
            this.result.handleResult.push('FILE_TYPE');
            this.finalExecute();
        }
        super.execute(this.result);
    }
}
