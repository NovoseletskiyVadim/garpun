const getFileMeta = require('./getFileMeta');
const FileType = require('file-type');
const eventHandler = require('../handlers/eventHandler');
const appLogger = require('../logger/logger');
// TODO: change path file
// const rejectFileHandler = require('./utils/rejectFileHandler');
// require('./db/dbConnect');




const watcherEventAddNewFile=function(){

    
    const fileMeta = getFileMeta(pathFile);
    FileType.fromFile(pathFile).then((type) => {
        if (!type || type.ext !== 'jpg') {
            fileMeta.isValid = false;
            fileMeta.notPassed.push('FILE_TYPE');
        }
        if (fileMeta.isValid) {
            eventHandler(fileMeta);
        } else {
            // TODO:
            appLogger.rejectFileLog({
                message: fileMeta.notPassed.join(),
                file: fileMeta.file,
            });
        rejectFileHandler(pathFile);
        console.error('WRONG_FILE', pathFile);
        }
    });

}

module.exports = { watcherEventAddNewFile };