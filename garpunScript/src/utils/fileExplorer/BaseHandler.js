const fs = require('fs');
const fsp = require('fs').promises;
const path = require('path');
const  { Transform, Writable } = require('stream');
const { pipeline } = require('stream').promises;
const { spawn } = require('child_process');
const { AppError, FileExplorerError } = require('../errorHandlers/index');

class BaseHandler {
    filePath = null;

    next = null;

    streamWithFileType = null;

    handleResult = {
        fileInfo: {
            fileStat: null,
            cameraName: null,
            fileName: null,
            plateNumber: null,
            eventDate: null,
            fileType: null,
        },
        handleResult: [],
        fileIssues: []
    };

    execute(previousResult) {
        if (previousResult) {
            this.handleResult = previousResult;
        }

        if (this.next) {
            this.next.execute(this.result);
        } else {
            this.finalExecute();
        }
    }

    setNext(nextHandleStrategy) {
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
            return await fsp.unlink(this.currentFilePath);
        } catch (error) {
            return new AppError(error, 'FILE_EXPLORE_ERROR');
        }
    }
}

module.exports = BaseHandler;