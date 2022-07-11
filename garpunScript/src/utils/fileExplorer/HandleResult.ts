import { FileStatHandlerResult } from './fileExplorerTypes';
import fs from 'fs';
import { printLog } from '../logger/appLogger';
import { FileStatHandler } from './FileStatHandler';
import { BaseHandler } from './BaseHandler';

export class HandleResult {
    private statHandlerResult:FileStatHandlerResult = {
        fileStat: null,
        cameraName: null,
        fileName: null,
        plateNumber: null,
        eventDate: null,
        fileType: null,
    }
    public handleSteps: Array<string> = [];
    public fileIssues:Array<string> = [];
    // public fileStat: null | fs.Stats 

    public moduleName: string;

    constructor(moduleName:string) {
        this.moduleName = moduleName;
    }

    public setFileStatInfo (handleResult:FileStatHandlerResult) {
        this.statHandlerResult = {...handleResult};
    }

    public badFileMessage():string {
        return `[${this.moduleName}] ${this.fileIssues.join(' ')} camera:${
            this.statHandlerResult.cameraName
            } photo:${this.statHandlerResult.fileName}${this.statHandlerResult.fileType}`
    }

    get cameraName() {
        return this.statHandlerResult.cameraName;
    }

    get fileNameWithExt() {
        return `${this.statHandlerResult.fileName}${this.statHandlerResult.fileType}`;
    }
}
