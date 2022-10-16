import { BaseHandler } from './BaseHandler';
import { CamerasWatcherProcessManager } from '../camerasWatcherProcess/ProcessManager';

export class CameraWatcherEvent extends BaseHandler {
    handleStepName = 'UPDATE_CAMERA_STATE';

    async execute() {

        CamerasWatcherProcessManager.getInstance().onCameraEvent(this.handleResult?.cameraName || 'unknown camera');

        await super.execute();
    }
}
