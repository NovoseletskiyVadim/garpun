import fs from 'fs';

import FileType   from 'file-type';

import { BaseHandler, ExecuteCommands } from './BaseHandler';
import config  from './FileHandler.config.json';
import { FilesTypes } from './FileRouter';

export class FileTypeChecker extends BaseHandler {
    handleStepName = 'CHK_FILE_TYPE';

    async execute() {

        this.handleResult.handleSteps.push(this.handleStepName);

        const fileTypeStream = await FileType.stream(this.handleResult.readStream);

        const { fileType } = fileTypeStream;

        this.handleResult.fileReadStream = fileTypeStream as fs.ReadStream;

        if (!fileType || fileType.ext !== config.fileType) {
            this.stopHandling([this.getFinalCommand(FilesTypes.TRASH), ExecuteCommands.SAVE_IN_DB, ExecuteCommands.BAD_FILE_MSG]);
        }

        await super.execute();
    }
}
