const  BaseHandler  = require('./BaseHandler');
const  FileStatHandler  = require('./FileStatHandler');
const  FileTypeChecker  = require('./FileTypeChecker');
// import { FileStatHandler } from './FileStatHandler';
// import { FileTypeChecker } from './FileTypeChecker';

class StartFileHandler extends BaseHandler {
    filePath = '';

    handleResult = null;

    constructor(filePath) {
        super();
        this.filePath = filePath;
    }

    execute() {
        this
            .setNext(new FileStatHandler(this.filePath))
            .setNext(new FileTypeChecker(this.filePath));
        this.next?.execute();
    }
}

module.exports = StartFileHandler;