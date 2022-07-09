import fs from 'fs';
import { type } from 'os';

export type HandlerResult = {
    fileInfo: {
        fileStat: null| Record<string, any>,
        cameraName: null | string,
        fileName: null | string,
        plateNumber: null | string,
        eventDate: null | string,
        fileType: null | string,
    },
    handleSteps: Array<string>,
    fileIssues: Array<string>
}

export type BaseResult = {
    handleSteps: Array<string>,
    fileIssues: Array<string>
} 

export type FileStatHandlerResult = {
    fileStat:null | {ctime: Date, size: number };
    cameraName: string | null;
    fileName: null | string;
    fileType: null | string;
    plateNumber: null | string;
    eventDate: null | string;
}

export type FinalExecuteCommands = {
    [key: string]: () => {}
}

export type PreviousResultTypes = BaseResult | FileStatHandlerResult;
