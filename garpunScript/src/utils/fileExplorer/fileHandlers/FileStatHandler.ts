import * as fs from 'fs';
import * as path from 'path';

import { BaseHandler, FileHandleResult } from './BaseHandler';
import { printLog } from './../../logger/appLogger';
import config from './FileStatHandler.config.json';
import moment from 'moment';

enum FileCheckResults {
    NAME_OK,
    SYS_FILE,
    WRONG_NAME,
}

export class FileStatHandler extends BaseHandler {
    filePath = '';

    constructor(filePath: string) {
        super();
        this.filePath = filePath;
    }

    async execute(previousResult?: FileHandleResult) {
        if (previousResult) {
            this.result = previousResult;
        }

        const fileStat = fs.statSync(this.filePath);

        if (!fileStat.isFile()) {
            printLog(`NOT A FILE ${this.filePath}`).errorSecond();
            await this.deleteFile();
            return;
        }

        const { ctime, size } = fileStat;
        this.result.fileInfo.fileStat = { ctime, size };

        const { dir, name } = path.parse(this.filePath);
        const splittedPath = dir.split(path.sep);
        this.result.fileInfo.cameraName = splittedPath[splittedPath.length - 1];
        this.result.fileInfo.fileName = name;

        const checkFileNameResult = this.checkFileName();

        if (checkFileNameResult === FileCheckResults.SYS_FILE) {
            await this.deleteFile();
            return;
        }

        if (checkFileNameResult === FileCheckResults.NAME_OK) {
            const [date, plateNumber] = name.split('_');
            if (!this.setPlateNumber(plateNumber) || !this.setEventTime(date)) {
                return this.finalExecute();
            }
        }

        super.execute(this.result);
    }

    private checkFileName(): FileCheckResults {
        const fileName = this.result.fileInfo?.fileName ?? '';
        const fileNameRegX = new RegExp(
            `^${config.eventTimeRegX}_${
                config.litePlateNumberRegX
            }_(${config.allowedEventsNames.join('|')})$`
        );
        const sysFileReX = new RegExp(
            `${config.ignoreSystemFileNames.join('|')}`
        );
        if (sysFileReX.test(fileName)) {
            return FileCheckResults.SYS_FILE;
        }
        if (!fileNameRegX.test(fileName)) {
            return FileCheckResults.WRONG_NAME;
        }
        return FileCheckResults.NAME_OK;
    }

    private setPlateNumber(plateNumber: string) {
        const plateNumberRegX = new RegExp(`${config.plateNumberRegX}`);
        if (!plateNumberRegX.test(plateNumber)) {
            this.result.handleResult.push('PLATE_NUMBER');
            return false;
        }
        this.result.fileInfo.plateNumber = plateNumber;
        return true;
    }

    private setEventTime(date: string) {
        const timeNow = moment().local();
        const dateInFormat = moment(date, 'YYYYMMDDHHmmssSSS', true);
        const isValidData = dateInFormat.isValid();
        if (!isValidData) {
            this.result.handleResult.push('TIME_STAMP');
            return false;
        } else {
            const camTime = timeNow.valueOf() - dateInFormat.valueOf();
            if (camTime > config.allowedOutOfSync || camTime < 0) {
                this.result.handleResult.push('CAM_TIME_SYNC');
            }
            this.result.fileInfo.eventDate = dateInFormat.format(
                'YYYY-MM-DDTHH:mm:ss.SSSZ'
            );
            return true;
        }
    }
}
