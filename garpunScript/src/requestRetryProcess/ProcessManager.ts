import { fork, ChildProcess } from 'child_process';


export class  RequestRetryProcessManager {
    private static instance: RequestRetryProcessManager;

    private childProcess: ChildProcess;

    constructor(childProcess: ChildProcess) {
        this.childProcess = childProcess;
    }


    public static getInstance(): RequestRetryProcessManager {
        if (!RequestRetryProcessManager.instance) {
            RequestRetryProcessManager.instance = new RequestRetryProcessManager(fork('./dist/requestRetryProcess'));
        }

        return RequestRetryProcessManager.instance;
    }

    start():void  {
        this.childProcess.send({ type: 'START' });
    }

    stop():void  {
        this.childProcess.send({ type: 'STOP' });
    }
}
