import path from 'path';
import fs, { promises } from 'fs';

import moment from 'moment';

import { AppError } from '../errorHandlers/appError';
import { appLogger } from '../logger/appLogger';
import appConfig from '../common/config';

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
        [FilesTypes.TRASH]: { dirPath: appConfig.TRASH_DIR, archiveDays: appConfig.TRASH_ARCHIVE_DAYS },
        [FilesTypes.ARCHIVE]: { dirPath: appConfig.ARCHIVE_DIR, archiveDays: appConfig.ARCHIVE_DAYS },
    };

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
                appLogger.setLogMessage(
                    new AppError(error, 'FILE_EXPLORE_ERROR')
                ).error();
            }
        }
        return { folderPath, isNewFolder };
    }

    private oldFilesCleaner  (camName:string, fileType:FilesTypes):Promise<string| void> {
        const { dirPath, archiveDays } = this.routerConfig[fileType];
        const dirToClean = path.join(dirPath, camName);
        try {
            if (!fs.existsSync(dirToClean)) {
                const msg = `${fileType} for ${camName} nothing to clean`;
                appLogger.setLogMessage(msg).appInfoMessage();
                return Promise.resolve(msg);
            }
        } catch (error) {
            appLogger.setLogMessage(new AppError(error, 'FILE_EXPLORE_ERROR')).error();
        }
        return fsp
            .readdir(dirToClean)
            .then((files) => {
                if (!files.length) {
                    const msg = `${fileType} for ${camName} nothing to clean`;
                    appLogger.setLogMessage(msg).appInfoMessage();
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
                    appLogger.setLogMessage(msg).appInfoMessage();
                    return msg;
                }
                const fileList = shouldBeDeleted.map((file) => {
                    const dirToDelete = path.join(
                        dirPath,
                        camName,
                        file
                    );
                    return fsp.rm(dirToDelete, { recursive: true });
                });
                return Promise.all(fileList).then(() => {
                    const msg = `${fileType} of ${camName} successful cleaned by ${shouldBeDeleted.join(
                        ', '
                    )}`;
                    appLogger.setLogMessage(msg).appInfoMessage();
                    return msg;
                });
            })
            .catch((error) => {
                appLogger.setLogMessage(
                    new AppError(error, 'FILE_EXPLORE_ERROR')
                ).error();
            });
    }

    pathToMoveFile (camName:string, fileType:FilesTypes) {
        const { folderPath, isNewFolder }  =  this.getFileDirPath(camName, fileType);

        if (isNewFolder) {
            this.oldFilesCleaner(camName, fileType);
        }

        return folderPath;
    }

    isFileArchiveOn():boolean {
        return Boolean(appConfig.ARCHIVE_DAYS);
    }

    isTrashArchiveOn():boolean {
        return Boolean(appConfig.TRASH_ARCHIVE_DAYS);
    }
}
