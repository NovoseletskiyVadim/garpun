import fs from 'fs';

import { BaseHandler, ExecuteCommands } from './BaseHandler';
import { HandleResult } from './HandleResult';
import config  from './FileStatHandler.config.json';

export class FileTypeChecker extends BaseHandler {

    constructor(filePath:string) {
        super(filePath);
        this.handleStepName = 'CHK_FILE_TYPE';
    }

    async execute(eventObj:HandleResult) {

        this.handleResult = eventObj;

        this.handleResult.handleSteps.push(this.handleStepName);

        const { fileTypeStream } = await import('file-type');
       
        const readStream = fs.createReadStream(this.filePath);

        this.streamWithFileType = await fileTypeStream(readStream);

        const { fileType } = this.streamWithFileType;

        if (!fileType || fileType.ext !== config.fileType) {
            eventObj.fileIssues.push('CHK_FILE_TYPE');
            this.shouldGoToNext = false;
            this.setHandlerFinalExecuteCommands([ExecuteCommands.DELETE]);
        }

        super.execute(this.handleResult);
    }
}