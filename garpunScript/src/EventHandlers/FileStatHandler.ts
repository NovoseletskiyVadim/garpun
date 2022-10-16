import fs from 'fs';
import moment from 'moment';
import path from 'path';

import { BaseHandler, ExecuteCommands } from './BaseHandler';

import { appLogger } from '../logger/appLogger';

import config from './FileHandler.config.json';
import { FilesTypes } from './FileRouter';


enum fileCheckResults {
    NAME_OK = 'NAME_OK',
    SYS_FILE = 'SYS_FILE',
    WRONG_NAME = 'WRONG_NAME',
}

export class FileStatHandler extends BaseHandler  {
    handleStepName = 'FILE_STAT';

    public fileStat:null | {ctime: Date, size: number } = null;

    public cameraName: string | null = null;

    public fileName: null | string = null;

    public fileType: null | string = null;

    public plateNumber: null | string = null;

    public eventDate: null | string = null;

    async execute() {

        const { filePath } =  this.handleResult;

        this.handleResult.handleSteps.push(this.handleStepName);

        let getFileStatResult;

        try {
            getFileStatResult = fs.statSync(filePath);
        } catch (error) {
            if (error instanceof Error) {
                appLogger.setLogMessage(`[${this.handleStepName}] ${error?.message}`)
                    .errorSecond()
                    .toErrorLog();
            }
            return;
        }

        if (!getFileStatResult.isFile()) {
            appLogger.setLogMessage(`NOT A FILE ${filePath}`).errorSecond();
            this.stopHandling([ExecuteCommands.DELETE]);

            await this.finalExecute();
            return;
        }

        const { ctime, size } = getFileStatResult;
        this.fileStat = { ctime, size };

        const { dir, name, ext } = path.parse(this.filePath);
        const splittedPath = dir.split(path.sep);
        this.cameraName = splittedPath[splittedPath.length - 1];
        this.fileName = name;
        this.fileType = ext;

        const [date, plateForCheck] = name.split('_');
        this.checkFileName();
        this.setPlateNumber(plateForCheck);
        this.setEventTime(date);

        const {
            fileName, fileStat, fileType, plateNumber, cameraName, eventDate
        } = this;
        this.handleResult.setFileStatInfo({
            fileName, fileStat, fileType, plateNumber, cameraName, eventDate
        });

        await this.handleResult.fetchCameraInfo();

        if (!this.shouldGoToNext) {
            this.setHandlerFinalExecuteCommands([
                this.getFinalCommand(FilesTypes.TRASH),
                ExecuteCommands.SAVE_IN_DB,
                ExecuteCommands.BAD_FILE_MSG,
            ]);
        }

        await super.execute();
    }

    private checkFileName():void {

        if (!this.fileName) {
            this.handleResult?.handleIssues.push(fileCheckResults.WRONG_NAME);
            this.shouldGoToNext = false;
            return;
        }

        const fileNameRegX = new RegExp(
            `^${config.eventTimeRegX}_${
                config.litePlateNumberRegX
            }_(${config.allowedEventsNames.join('|')})$`
        );

        const sysFileReX = new RegExp(
            `${config.ignoreSystemFileNames.join('|')}`
        );

        if (sysFileReX.test(this.fileName)) {
            this.handleResult?.handleIssues.push(fileCheckResults.SYS_FILE);
            this.shouldGoToNext = false;
        }

        if (!fileNameRegX.test(this.fileName)) {
            this.handleResult?.handleIssues.push(fileCheckResults.WRONG_NAME);
            this.shouldGoToNext = false;
        }
    }

    private setPlateNumber(plateNumber:string):void {
        const plateNumberRegX = new RegExp(`${config.plateNumberRegX}`);
        if (!plateNumberRegX.test(plateNumber)) {
            this.handleResult?.handleIssues.push('PLATE_NUMBER');
            this.shouldGoToNext = false;
            return;
        }
        this.plateNumber = plateNumber;
    }

    private setEventTime(date:string):void {
        const timeNow = moment().local();
        const dateInFormat = moment(date, 'YYYYMMDDHHmmssSSS', true);
        const isValidData = dateInFormat.isValid();
        if (!isValidData) {
            this.handleResult?.handleIssues.push('TIME_STAMP');
            this.shouldGoToNext = false;
            return;
        }
        const camTime = timeNow.valueOf() - dateInFormat.valueOf();
        if (camTime > config.allowedOutOfSync || camTime < 0) {
            this.handleResult?.handleIssues.push('CAM_TIME_SYNC');
        }
        this.eventDate = dateInFormat.format(
            'YYYY-MM-DDTHH:mm:ss.SSSZ'
        );
    }
}
