import fs, { ReadStream, WriteStream } from 'fs';
import { finished }  from 'node:stream/promises';
import fsp  from 'fs/promises';

import { BaseResult, FinalExecuteCommands, HandlerResult, PreviousResultTypes } from './fileExplorerTypes';
import { FileRouter, FilesTypes } from './FileRouter';
import { HandleResult } from './HandleResult';
import path from 'path';



const { AppError} = require('../errorHandlers/index');
const { printLog } = require('../logger/appLogger');

export enum ExecuteCommands  {
    DELETE = 'DELETE',
    BAD_FILE_MSG = 'BAD_FILE_MSG',
    COPY_TO_ARCHIVE = 'COPY_TO_ARCHIVE',
    COPY_TO_TRASH = 'COPY_TO_TRASH'
}

export type CommandType = {
    [key: string]: () => string
} 

export class BaseHandler {
    filePath = '';

    protected handleStepName = 'Base';

    shouldGoToNext:boolean = true;
    
    next: null | BaseHandler = null;

    fileRouter = new FileRouter();

    readFileStream:ReadStream | null = null;

    moduleName:string | undefined;

    private handlerFinalExecuteCommands: string[] = []

    handleResult:HandleResult| null = null;

    finalExecuteCommands:FinalExecuteCommands  = {
        DELETE: async () =>  this.deleteFile(),
        BAD_FILE_MSG: async () => this.sendBadFileMsg(),
        COPY_TO_ARCHIVE: async () => this.copyFile(FilesTypes.ARCHIVE),
        COPY_TO_TRASH: async () => this.copyFile(FilesTypes.TRASH),
    }
/**
 * 
 * @param {string} filePath 
 * @param {string} moduleName 
 */
    constructor(filePath: string, moduleName?: string) {
        this.filePath = filePath;
        this.moduleName = moduleName;
    }



    

    execute(previousResult?:HandleResult| null, readFileStream?:ReadStream | null) {

        if (this.next && this.shouldGoToNext) {
            this.next.execute(this.handleResult);
        } else {
            this.finalExecute();
        }
    }

    setNext(nextHandleStrategy:BaseHandler,  ) {
        this.next = nextHandleStrategy;
        return nextHandleStrategy;
    }

    get finalExecuteQueryMsg ():string {
        return this.handlerFinalExecuteCommands.map(command => `[${command}]`).join('');
    }

    setHandlerFinalExecuteCommands(commandsList:string[]) {
        commandsList.forEach(commandName =>{
            const isFunctionExist = Object.keys(this.finalExecuteCommands).includes(commandName);
            if (!isFunctionExist) throw new Error(`Command ${commandName} not exist`);
            this.handlerFinalExecuteCommands.push(commandName);
        })
        
    }

    // eslint-disable-next-line class-methods-use-this
    async finalExecute() {
        if(this.handlerFinalExecuteCommands.length === 0) {
            console.log('No command for the end');
            return;
        }

        
        
        for (let index = 0; index < this.handlerFinalExecuteCommands.length; index += 1) {
            // eslint-disable-next-line no-await-in-loop
            const commandName = this.handlerFinalExecuteCommands[index];
            await this.finalExecuteCommands[commandName]();
        }
    }

    sendBadFileMsg(): void {
        const badFileInfoMsg = this.handleResult?.badFileMessage();
        printLog(`${badFileInfoMsg} ${this.finalExecuteQueryMsg}`).errorSecond();
    }
    
    /**
     * @description Delete file to trash archive
     */
     async deleteFile(): Promise<any> {
        try {
            return await fsp.unlink(this.filePath);
        } catch (error) {
            return new AppError(error, 'FILE_EXPLORE_ERROR');
        }
    }

    async copyFile( fileType: FilesTypes):Promise<void> {
        let readFileStream = this.readFileStream;
        if(!readFileStream) {
            readFileStream = fs.createReadStream(this.filePath);
        }

        if (this.handleResult &&  this.handleResult.cameraName) {
            const pathToMove = this.fileRouter.pathToMoveFile(this.handleResult.cameraName, fileType);
            const pathToMoveWithFileName = path.join(pathToMove, this.handleResult.fileNameWithExt);
            const wr = fs.createWriteStream(pathToMoveWithFileName);
            readFileStream.pipe(wr);
            try {
                await finished(readFileStream);
                this.deleteFile();
            } catch (error) {
                printLog(
                    new AppError(error, 'FILE_EXPLORE_ERROR')
                ).error();
            }

            return;
        }
        printLog(
            new AppError(new Error('cameraName empty'), 'FILE_EXPLORE_ERROR')
        ).error();
    }

    getFinalCommand(fileType:FilesTypes): string {
        const commandType:CommandType = {
            [FilesTypes.TRASH]: () => this.fileRouter.isTrashArchiveOn() ? ExecuteCommands.COPY_TO_TRASH : ExecuteCommands.DELETE,
            [FilesTypes.ARCHIVE]: () => this.fileRouter.isFileArchiveOn() ? ExecuteCommands.COPY_TO_ARCHIVE : ExecuteCommands.DELETE,
        }

        return commandType[fileType]();
    }
}
