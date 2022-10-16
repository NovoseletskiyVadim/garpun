import { BaseHandler } from './BaseHandler';
import { JsonSenderError } from '../errorHandlers/jsonSenderError';
import { appLogger } from '../logger/appLogger';
import { EventHandlerError } from '../errorHandlers/handlerError';
import { AppError } from '../errorHandlers/appError';
// import appConfig from '../common/config';
import { ApiConnector } from '../apiConnector/ApiConnector';
import { SuccessfulResponseHandler } from '../apiConnector/SuccessfulResponseHandler';

export class SendToApi extends BaseHandler {
    handleStepName = 'SEND_TO_API';

    async execute() {

        try {
            const { apiResponse, isSent } = await new ApiConnector(this.handleResult?.prepareJsonToSend()).sendData();

            this.handleResult.updateInDb({ apiResponse: JSON.stringify(apiResponse),  uploaded: isSent });

            const logger = appLogger.setLogMessage(new SuccessfulResponseHandler({
                camera: this.handleResult.cameraName || '?',
                fileName: this.handleResult.fileNameWithExt,
                sender: this.handleResult.moduleName,
                eventTime: this.handleResult.eventDate,
                warning: this.handleResult.handleIssues,
                apiResponse,
                operations: this.handleResult.handleSteps
            }));

            if (isSent) {
                logger.successful();
            } else {
                logger.errorSecond();
            }

        } catch (error:any) {
            let apiError: JsonSenderError| null = null;

            if (error instanceof JsonSenderError) {
                apiError = error;
            }

            if ('isAxiosError' in error) {
                apiError = new JsonSenderError(error);
            }

            if (apiError) {
                if (this.next) {
                    const lastEventHandler = this.next.handleStepName;
                    this.handleResult.handleSteps.push(lastEventHandler);
                }
                appLogger.setLogMessage(
                    new EventHandlerError(apiError, {
                        senderName: this.handleResult.moduleName,
                        cameraName: this.handleResult?.cameraName || ' ? ',
                        file: this.handleResult?.fileNameWithExt,
                        handleSteps: this.handleResult.handleSteps,
                        eventIssues: this.handleResult.handleIssues,
                    })
                ).errorSecond();
                await super.execute();
                return;
            }
            appLogger.setLogMessage(
                new AppError(error, this.moduleName)
            ).error();
        }
    }
}
