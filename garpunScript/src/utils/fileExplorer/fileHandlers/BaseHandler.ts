import { Stats } from 'fs';

import { unlink } from 'fs/promises';

export type FileHandleResult = {
    fileInfo: {
        fileStat: Partial<Stats> | null;
        cameraName: string | null;
        fileName: string | null;
        plateNumber: string | null;
        eventDate: string | null;
        fileType: FileType | null;
    };
    handleResult: string[];
};

export type FileStat = {
    ctime: Date;
    size: number;
};

export type FileType = {
    ext: string;
    mime: string;
};

export type ExecuteArg = FileHandleResult | null;

export abstract class BaseHandler {
    abstract filePath: string;

    next: BaseHandler | null = null;

    result: FileHandleResult = {
        fileInfo: {
            fileStat: null,
            cameraName: null,
            fileName: null,
            plateNumber: null,
            eventDate: null,
            fileType: null,
        },
        handleResult: [],
    };

    execute(previousResult?: FileHandleResult): void {
        if (previousResult) {
            this.result = previousResult;
        }

        if (this.next) {
            this.next.execute(this.result);
        } else {
            this.finalExecute();
        }
    }

    setNext(nextHandleStrategy: BaseHandler) {
        this.next = nextHandleStrategy;
        return nextHandleStrategy;
    }

    finalExecute() {
        console.log(JSON.stringify(this.result));
    }
    /**
     * @description Move file to trash archive
     */

    async deleteFile() {
        try {
            await unlink(this.filePath);
        } catch (error) {
            //TODO
            console.error(error);
        }
    }
}
