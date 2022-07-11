import fs from 'fs';

import FileType   from 'file-type';

import { BaseHandler, ExecuteCommands } from './BaseHandler';
import { HandleResult } from './HandleResult';
import config  from './FileStatHandler.config.json';
import { FilesTypes } from './FileRouter';

export class FileTypeChecker extends BaseHandler {

    constructor(filePath:string) {
        super(filePath);
        this.handleStepName = 'CHK_FILE_TYPE';
    }

    async execute(eventObj:HandleResult) {

        this.handleResult = eventObj;

        this.handleResult.handleSteps.push(this.handleStepName);

        this.readFileStream = fs.createReadStream(this.filePath);

        const fileTypeResult = await FileType.fromStream(this.readFileStream);

        if (!fileTypeResult || fileTypeResult.ext !== config.fileType) {
            eventObj.fileIssues.push('CHK_FILE_TYPE');
            this.shouldGoToNext = false;
            this.setHandlerFinalExecuteCommands([this.getFinalCommand(FilesTypes.TRASH), ExecuteCommands.BAD_FILE_MSG]);
        }

        super.execute(this.handleResult, this.readFileStream);
    }
}