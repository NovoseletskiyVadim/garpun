import { ReadableStreamWithFileType } from 'file-type';
import { BaseResult, FinalExecuteCommands, HandlerResult, PreviousResultTypes } from './fileExplorerTypes';
import { HandleResult } from './HandleResult';

const fsp = require('fs').promises;

const { AppError} = require('../errorHandlers/index');
const { printLog } = require('../logger/appLogger');

export enum ExecuteCommands  {
    DELETE = 'DELETE',
    BAD_FILE_MSG = 'BAD_FILE_MSG',
}

export class BaseHandler {
    filePath = '';

    protected handleStepName = 'Base';

    shouldGoToNext:boolean = true;
    
    next: null | BaseHandler = null;

    streamWithFileType:ReadableStreamWithFileType | null = null;

    moduleName:string | undefined;

    finalExecuteQuery = ''

    private handlerFinalExecuteCommands: string[] = []

    handleResult:HandleResult| null = null;

    finalExecuteCommands:FinalExecuteCommands  = {
        DELETE: async () =>  this.deleteFile(),
        BAD_FILE_MSG: async () => this.sendBadFileMsg(),
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



    

    execute(previousResult?:HandleResult| null) {

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
            // const isFunctionExist = Object.keys(this.finalExecuteCommands).includes(commandName);
            const commandName = this.handlerFinalExecuteCommands[index];
            await this.finalExecuteCommands[commandName]();
        }
    }

    sendBadFileMsg(): void {
        const badFileInfoMsg = this.handleResult?.badFileMessage();
        printLog(`${badFileInfoMsg} ${this.finalExecuteQueryMsg}`).errorSecond();
    }
    
    /**
     * @description Move file to trash archive
     */

    
     async deleteFile(): Promise<any> {
        try {
            return await fsp.unlink(this.filePath);
        } catch (error) {
            return new AppError(error, 'FILE_EXPLORE_ERROR');
        }
    }
}
