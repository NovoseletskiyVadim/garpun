const fs = require('fs');

const  BaseHandler  = require('./BaseHandler');
const config  = require('./FileStatHandler.config.json');

class FileTypeChecker extends BaseHandler {

    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    async execute(previousResult) {
        const { fileTypeStream } = await import('file-type');
        if (previousResult) {
            this.handleResult = previousResult;
        }

        const readStream = fs.createReadStream(this.filePath);

        this.streamWithFileType = await fileTypeStream(readStream);

        const { fileType } = this.streamWithFileType;

        if (!fileType || fileType.ext !== config.fileType) {
            this.handleResult.fileIssues.push('CHK_FILE_TYPE)');
            this.finalExecute();
        }

        super.execute(this.result,  this.streamWithFileType);
    }
}

module.exports = FileTypeChecker;