import { BaseHandler, ExecuteCommands } from './BaseHandler';
import { FilesTypes } from './FileRouter';

export class Base64Transform extends BaseHandler {
    streamBuffer:Array<string | Buffer> = [];

    handleStepName = 'BASE_64_TRANSFORM';

    async execute() {

        this.setHandlerFinalExecuteCommands([ExecuteCommands.SAVE_IN_DB, this.getFinalCommand(FilesTypes.ARCHIVE)]);

        this.handleResult.readStream.on('data', (chunk) => {
            this.streamBuffer.push(chunk);
        });

        try {
            await this.finalExecute();
            this.handleResult.setFileInBase64(this.streamBuffer);
            this.handleResult.handleSteps.push(this.getFinalCommand(FilesTypes.ARCHIVE));
        } catch (error) {
            console.log(error);
            this.stopHandling([ExecuteCommands.DELETE, ExecuteCommands.SAVE_IN_DB,  ExecuteCommands.BAD_FILE_MSG]);
        }

        this.setHandlerFinalExecuteCommands([]);

        await super.execute();
    }
}
