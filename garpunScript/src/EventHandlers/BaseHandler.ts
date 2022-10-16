/* eslint-disable @typescript-eslint/no-unused-vars */
import fs, { ReadStream, WriteStream } from 'fs';
import { finished }  from 'node:stream/promises';
import fsp  from 'fs/promises';

import {
 BaseResult, FinalExecuteCommands, HandlerResult, PreviousResultTypes
} from './fileExplorerTypes';
import { FileRouter, FilesTypes } from './FileRouter';
import { HandleResult } from './HandleResult';
import path from 'path';
import internal from 'stream';
import { appLogger } from '../logger/appLogger';
import { AppError } from '../errorHandlers/index';

export enum ExecuteCommands  {
    DELETE = 'DELETE',
    BAD_FILE_MSG = 'BAD_FILE_MSG',
    COPY_TO_ARCHIVE = 'COPY_TO_ARCHIVE',
    COPY_TO_TRASH = 'COPY_TO_TRASH',
    SAVE_IN_DB = 'SAVE_IN_DB'
}

export type CommandType = {
    [key: string]: () => string
}

export class BaseHandler {

    shouldGoToNext:boolean = true;

    next: null | BaseHandler = null;

    fileRouter = new FileRouter();

    moduleName:string | undefined;

    handleStepName:string = '';

    private handlerFinalExecuteCommands: string[] = [];

    private _handleResult:HandleResult| null = null;

    finalExecuteCommands:FinalExecuteCommands  = {
        DELETE: async () =>  this.deleteFile(),
        BAD_FILE_MSG: async () => this.sendBadFileMsg(),
        COPY_TO_ARCHIVE: async () => this.copyFile(FilesTypes.ARCHIVE),
        COPY_TO_TRASH: async () => this.copyFile(FilesTypes.TRASH),
        SAVE_IN_DB: async () => this.handleResult.createInDb(),
    };

    async execute(): Promise<void> {

        if (this.next && this.shouldGoToNext) {
            this.next.setHandleResult(this.handleResult);
            await this.next.execute();
        } else {
            await this.finalExecute();
        }
    }

    setNext(nextHandleStrategy:BaseHandler,) {
        this.next = nextHandleStrategy;
        return nextHandleStrategy;
    }

    get finalExecuteQueryMsg ():string {
        return this.handlerFinalExecuteCommands.map(command => `[${command}]`).join('');
    }

    setHandlerFinalExecuteCommands(commandsList:string[]) {
        this.handlerFinalExecuteCommands = [];
        commandsList.forEach(commandName => {
            const isFunctionExist = Object.keys(this.finalExecuteCommands).includes(commandName);
            if (!isFunctionExist) throw new Error(`Command ${commandName} not exist`);
            this.handlerFinalExecuteCommands.push(commandName);
        });

    }

    // eslint-disable-next-line class-methods-use-this
    async finalExecute() {
        if (this.handlerFinalExecuteCommands.length === 0) {
            console.log('No command for the end');
            return;
        }

        for (let index = 0; index < this.handlerFinalExecuteCommands.length; index += 1) {
            const commandName = this.handlerFinalExecuteCommands[index];
             // eslint-disable-next-line no-await-in-loop
            await this.finalExecuteCommands[commandName]();
        }
    }

    sendBadFileMsg(): void {
        const badFileInfoMsg = this.handleResult?.badFileMessage();
        appLogger.setLogMessage(`${badFileInfoMsg} operations:${this.finalExecuteQueryMsg}`).errorSecond();
    }

    async deleteFile(): Promise<any> {
        try {
            return await fsp.unlink(this.filePath);
        } catch (error) {
            return new AppError(error, 'FILE_EXPLORE_ERROR');
        }
    }

    get handleResult():HandleResult {
        if (!this._handleResult) throw new Error('Empty handleResult');

        return this._handleResult;
    }

    setHandleResult(previousResult:HandleResult): void {
        this._handleResult = previousResult;
    }

    async copyFile(fileType: FilesTypes):Promise<void> {

        const { readStream } =  this.handleResult;

        if (this.handleResult &&  this.handleResult.cameraName) {
            const pathToMove = this.fileRouter.pathToMoveFile(this.handleResult.cameraName, fileType);
            const pathToMoveWithFileName = path.join(pathToMove, this.handleResult.fileNameWithExt);
            const wr = fs.createWriteStream(pathToMoveWithFileName);
            readStream.pipe(wr);
            try {
                await new Promise((resolve, reject) => {
                    readStream?.on('close', () => {
                        resolve('done');
                    });

                    readStream?.on('error', (error) => {
                        reject(error);
                    });
                });
                await this.deleteFile();
            } catch (error) {
                appLogger.setLogMessage(
                    new AppError(error, 'FILE_EXPLORE_ERROR')
                ).error();
            }

            return;
        }
        appLogger.setLogMessage(
            new AppError(new Error('cameraName empty'), 'FILE_EXPLORE_ERROR')
        ).error();
    }

    getFinalCommand(fileType:FilesTypes): string {
        const commandType:CommandType = {
            [FilesTypes.TRASH]: () => (this.fileRouter.isTrashArchiveOn() ? ExecuteCommands.COPY_TO_TRASH : ExecuteCommands.DELETE),
            [FilesTypes.ARCHIVE]: () => (this.fileRouter.isFileArchiveOn() ? ExecuteCommands.COPY_TO_ARCHIVE : ExecuteCommands.DELETE),
        };
        return commandType[fileType]();
    }

    get filePath(): string {
        if (!this.handleResult) throw new Error('EMPTY_FILE_PATH');
        return this.handleResult.filePath;
    }

    stopHandling(endCommandsList: Array<string>) {
        if (!this.handleResult) throw new Error('empty handleResult');

        this.handleResult.handleIssues.push(this.handleStepName);
        this.shouldGoToNext = false;
        this.setHandlerFinalExecuteCommands(endCommandsList);
    }
}
