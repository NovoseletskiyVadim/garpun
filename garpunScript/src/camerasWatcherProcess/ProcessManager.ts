import { fork, ChildProcess } from 'child_process';


export class  CamerasWatcherProcessManager {
    private static instance: CamerasWatcherProcessManager;

    private childProcess: ChildProcess;

    constructor(childProcess: ChildProcess) {
        this.childProcess = childProcess;
    }


    public static getInstance(): CamerasWatcherProcessManager {
        if (!CamerasWatcherProcessManager.instance) {
            CamerasWatcherProcessManager.instance = new CamerasWatcherProcessManager(fork('./dist/camerasWatcherProcess'));
        }

        return CamerasWatcherProcessManager.instance;
    }

    start():void  {
        this.childProcess.send({ type: 'START' });
    }

    async isSuccessfullyStarted():Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.childProcess.on('message', (data: any) => {
                const { status } = data;

                if (status) {
                    return resolve(true);
                }
                return reject(new Error('CamerasWatcher not started'));
            });
        });
    }

    onCameraEvent(data: string):void {
        this.childProcess.send({ type: 'EVENT', data });
    }

    async getCamerasStat() {
        this.childProcess.send({ type: 'GET_STATS' });

        return new Promise((resolve, reject) => {
            this.childProcess.on('message', (data: any) => {
                const { cameraStats } = data;
                if (cameraStats) {
                    return resolve(cameraStats);
                }
                return reject(new Error('Cameras stat nor collected'));
            });
        });
    }

}
