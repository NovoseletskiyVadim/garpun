const moment = require('moment');
const fs = require('fs');
const path = require('path');


const { printLog } = require('../logger/appLogger');
const  BaseHandler  = require('./BaseHandler');
const config = require('./FileStatHandler.config.json');


const fileCheckResults = {
    NAME_OK:  'NAME_OK',
    SYS_FILE: 'SYS_FILE',
    WRONG_NAME: 'WRONG_NAME',
};




class FileStatHandler extends BaseHandler {
    filePath = '';

    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    async execute(previousResult) {
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

        if (checkFileNameResult === fileCheckResults.SYS_FILE) {
            await this.deleteFile();
            return;
        }

        if (checkFileNameResult === fileCheckResults.NAME_OK) {
            const [date, plateNumber] = name.split('_');
            if (!this.setPlateNumber(plateNumber) || !this.setEventTime(date)) {
                this.finalExecute();
                return;
            }
        }

        super.execute(this.result);
    }

    checkFileName() {
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
            return fileCheckResults.SYS_FILE;
        }
        if (!fileNameRegX.test(fileName)) {
            return fileCheckResults.WRONG_NAME;
        }
        return fileCheckResults.NAME_OK;
    }

    setPlateNumber(plateNumber) {
        const plateNumberRegX = new RegExp(`${config.plateNumberRegX}`);
        if (!plateNumberRegX.test(plateNumber)) {
            this.result.handleResult.push('PLATE_NUMBER');
            return false;
        }
        this.result.fileInfo.plateNumber = plateNumber;
        return true;
    }

    setEventTime(date) {
        const timeNow = moment().local();
        const dateInFormat = moment(date, 'YYYYMMDDHHmmssSSS', true);
        const isValidData = dateInFormat.isValid();
        if (!isValidData) {
            this.result.handleResult.push('TIME_STAMP');
            return false;
        } 
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

module.exports = FileStatHandler;