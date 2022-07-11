import path from 'path';
import fs from 'fs';
import { promises } from 'fs';

import moment from 'moment';

import {
    TRASH_ARCHIVE_DAYS,
    ARCHIVE_DAYS,
    TRASH_DIR,
    ARCHIVE_DIR,
}  from '../../common/config';
import AppError from '../errorHandlers/appError';
import { printLog } from '../logger/appLogger';

const fsp = promises;

type FileRouterConfig = {
    [key: string] : {dirPath: string, archiveDays: number };
}

type FileDirPath = {
    folderPath :string;
    isNewFolder: boolean;
}

export enum FilesTypes{
    TRASH = 'TRASH',
    ARCHIVE = 'ARCHIVE'
}

export class FileRouter {

    private routerConfig:FileRouterConfig = {
        [FilesTypes.TRASH]: { dirPath: TRASH_DIR, archiveDays: TRASH_ARCHIVE_DAYS },
        [FilesTypes.ARCHIVE]: { dirPath: ARCHIVE_DIR, archiveDays: ARCHIVE_DAYS },
    }

    private getFileDirPath (camName:string, fileType:FilesTypes):FileDirPath  {
        const { dirPath } = this.routerConfig[fileType];
        const today = moment().format('YYYYMMDD');
        let isNewFolder = false;
        const folderPath = path.join(dirPath, camName, today.toString());
        if (!fs.existsSync(folderPath)) {
            try {
                fs.mkdirSync(folderPath, { recursive: true });
                isNewFolder = true;
            } catch (error) {
                printLog(
                    new AppError(error, 'FILE_EXPLORE_ERROR')
                ).error();
            }
        }
        return { folderPath, isNewFolder };
    };

    private oldFilesCleaner  (camName:string, fileType:FilesTypes):Promise<string| void> {
        const { dirPath, archiveDays } = this.routerConfig[fileType];
        const dirToClean = path.join(dirPath, camName);
        try {
            if (!fs.existsSync(dirToClean)) {
                const msg = `${fileType} for ${camName} nothing to clean`;
                printLog(msg).appInfoMessage();
                return Promise.resolve(msg);
            }
        } catch (error) {
            printLog(new AppError(error, 'FILE_EXPLORE_ERROR')).error();
        }
        return fsp
            .readdir(dirToClean)
            .then((files) => {
                if (!files.length) {
                    const msg = `${fileType} for ${camName} nothing to clean`;
                    printLog(msg).appInfoMessage();
                    return msg;
                }
                const shouldBeSaved: Array<string> = [];
                for (let index = 0; index < archiveDays; index += 1) {
                    const dayName = moment()
                        .subtract(index, 'days')
                        .format('YYYYMMDD');
                    shouldBeSaved.push(dayName);
                }
    
                const shouldBeDeleted = files.filter(
                    (file) => !shouldBeSaved.includes(file)
                );
    
                if (!shouldBeDeleted.length) {
                    const msg = `${fileType} for ${camName} nothing to clean`;
                    printLog(msg).appInfoMessage();
                    return msg;
                }
                const fileList = shouldBeDeleted.map((file) => {
                    const dirToDelete = path.join(
                        dirPath,
                        camName,
                        file
                    );
                    return fsp.rmdir(dirToDelete, { recursive: true });
                });
                return Promise.all(fileList).then(() => {
                    const msg = `${fileType} of ${camName} successful cleaned by ${shouldBeDeleted.join(
                        ', '
                    )}`;
                    printLog(msg).appInfoMessage();
                    return msg;
                });
            })
            .catch((error) => {
                printLog(
                    new AppError(error, 'FILE_EXPLORE_ERROR')
                ).error();
            });
    };

    pathToMoveFile (camName:string, fileType:FilesTypes) {
        const { folderPath, isNewFolder }  =  this.getFileDirPath(camName, fileType);

        if(isNewFolder) {
            this.oldFilesCleaner(camName, fileType);
        }

        return folderPath;
    }

    isFileArchiveOn():boolean {
        return Boolean(ARCHIVE_DAYS);
    }

    isTrashArchiveOn():boolean {
        return Boolean(TRASH_ARCHIVE_DAYS);
    }
}