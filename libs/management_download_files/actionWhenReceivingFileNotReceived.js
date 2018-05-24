/*
 * Выполняется когда от источника приходит JSON пакет информирующий о завершении передачи файла
 * НЕУДАЧНАЯ ЗАГРУЗКА ФАЙЛА
 * выполняются изменеия в следующих таблицах:
 *
 * - task_loading_files:*
 * - task_filtering_all_information:*
 *
 * Версия 0.2, дата релиза 16.09.2016
 * */

'use strict';

const async = require('async');

module.exports = function(redis, obj, func) {
    let taskIndexHash = obj.taskIndex.split(':')[1];

    async.waterfall([
        function(callback) {
            redis.hget('task_filtering_all_information:' + taskIndexHash,
                'countFilesLoadedError',
                function(err, countFilesLoadedError) {
                    if (err) callback(err);
                    else callback(null, countFilesLoadedError);
                });
        },
        function(countFilesLoadedError, callback) {
            redis.hset('task_filtering_all_information:' + taskIndexHash,
                'countFilesLoadedError', ++countFilesLoadedError,
                function(err) {
                    if (err) callback(err);
                    else callback(null);
                });
        },
        function(callback) {
            redis.hget('task_loading_files:' + taskIndexHash, obj.fileName, function(err, value) {
                if (err) callback(err);
                else callback(null, value);
            });
        },
        function(value, callback) {
            let arrayValue = value.split('/');

            let newValue = arrayValue[0] + '/' + arrayValue[1] + '/error';
            redis.hset('task_loading_files:' + taskIndexHash, obj.fileName, newValue, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        }
    ], function(err) {
        if (err) func(err);
        else func();
    });
};