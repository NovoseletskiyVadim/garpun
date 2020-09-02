// Модуль проверки и логирования в json при добавлении новых файлов в папку
// на основе рег выражений

const FileType = require('file-type');
const LogRegExp = require('../utils/logerRegExp');





const eventWatchAddNewFile=function(pathFile){

    FileType.fromFile(pathFile).then((type) => {

        const patternCheckNameFile=/(\d{17})_([a-zA-Z0-9А-Яа-я]{4,8})_(VEHICLE_DETECTION)/;
        const RegExpArray=pathFile.match(patternCheckNameFile);
  
        if (type && type.ext === 'jpg') {
          
          LogRegExp.saveDetectEvent(RegExpArray);
  
        } else {
  
          const err='WRONG_FILE_TYPE'     
  
          LogRegExp.saveErrorEvent(RegExpArray,err);
        
        }
      });


};

module.exports={eventWatchAddNewFile};
