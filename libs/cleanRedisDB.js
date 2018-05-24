/*
 * Очистка таблиц БД
 *
 * Версия 0.1, дата релиза 13.05.2016
 * */

'use strict';

const writeLogFile = require('./writeLogFile');


//удаляем таблицы содержащие списки задач на загрузку файлов
module.exports.cleanTableTaskUploadFiles = function(redis) {
    redis.del('task_turn_downloading_files', function(err) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());
    });
    redis.del('task_implementation_downloading_files', function(err) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());
    });
};