import { PendingEventModel } from '../models/pendingEvent';
import { AppError } from '../errorHandlers';
import { appLogger } from '../logger/appLogger';
import { BaseHandler } from './BaseHandler';

export class ApiErrorHandler extends BaseHandler {
    handleStepName = 'API_ERROR_HANDLER';

    async execute() {

        try {
            await PendingEventModel.create({
                status: 'API_ERROR',
                data: this.handleResult.prepareJsonToSend(),
                dbID: this.handleResult.dbInstance?.id,
                fileMeta: {
                    cameraName: this.handleResult?.cameraName,
                    file: this.handleResult?.fileNameWithExt
                },
            });
        } catch (error) {
            appLogger.setLogMessage(new AppError(error, this.moduleName)).error();
        }
    }
}
