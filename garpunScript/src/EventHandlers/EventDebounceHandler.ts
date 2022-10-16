import { EventDebounce } from '../eventDebounce/EventDebounce';
import { BaseHandler, ExecuteCommands } from './BaseHandler';

export class EventDebounceHandler extends BaseHandler {
    handleStepName = 'DEBOUNCE';

    async execute() {
        const { cameraName, plateNumber } = this.handleResult;
        const { isSpam, calc } = EventDebounce
            .getInstance()
            .check(cameraName, plateNumber);

        if (isSpam) {
            this.handleResult.handleIssues.push(`[SPAM-${calc}]`);
            this.stopHandling([ExecuteCommands.DELETE, ExecuteCommands.BAD_FILE_MSG]);
        }

        await super.execute();
    }
}
