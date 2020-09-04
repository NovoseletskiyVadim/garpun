const FileType = require('file-type');
const getFileMeta = require('./getFileMeta');
const eventHandler = require('../handlers/eventHandler');
const appLogger = require('../logger/logger');
const rejectFileHandler = require('../handlers/rejectFileHandler');
// TODO: change path file
// require('./db/dbConnect');




const watcherEventAddNewFile=function(pathFile){

    const fileMeta = getFileMeta(pathFile);

    FileType.fromFile(pathFile).then((type) => {
        
        if (!type || type.ext !== 'jpg') {

            fileMeta.isValid = false;
            fileMeta.notPassed.push('FILE_TYPE');

        }
        if (fileMeta.isValid) {
            
            eventHandler(fileMeta);

        } else {
            
            appLogger.rejectFileLog({

                message: fileMeta.notPassed.join(),
                // FIXME:fileMeta.file>fileMeta.file.fullPath
                file: fileMeta.file.fullPath,
                
            });

            rejectFileHandler(pathFile);
            // console.error('WRONG_FILE', pathFile);
        }
    });

}

module.exports = { watcherEventAddNewFile };