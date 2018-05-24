/*
 * Выполняется когда от источника приходит JSON пакет информирующий о завершении передачи файла
 * УДАЧНАЯ ЗАГРУЗКА ФАЙЛА
 * выполняются изменеия в следующих таблицах:
 *
 * - task_loading_files:*
 * - task_filtering_all_information:*
 *
 * Версия 0.2, дата релиза 16.09.2016
 * */

'use strict';

const fs = require('fs');
const async = require('async');

module.exports = function (redis, obj, func) {
    let taskIndexHash = obj.taskIndex.split(':')[1];

    async.waterfall([
        function (callback) {
            redis.hmget('task_filtering_all_information:' + taskIndexHash,
                'countFilesLoaded',
                'uploadDirectoryFiles',
                function (err, value) {
                    if(err) callback(err);
                    else callback(null, +value[0], value[1]);
            });
        },
        //увеличиваем счетчик успешно загруженных файлов на 1
        function (countFilesLoaded, uploadDirectoryFiles, callback) {
            redis.hset('task_filtering_all_information:' + taskIndexHash, 'countFilesLoaded', ++countFilesLoaded, function (err) {
                if(err) callback(err);
                else callback(null, uploadDirectoryFiles);
            });
        },
        //получаем размер загруженного файла
        function (uploadDirectoryFiles, callback) {
            fs.lstat(uploadDirectoryFiles + '/' + obj.fileName, function (err, fileStat) {
                if(err) callback(err);
                else callback(null, fileStat.size);
            });
        },
        //получаем информацию по загружаемомму файлу
        function (fileSize, callback) {
            redis.hget('task_loading_files:' + taskIndexHash, obj.fileName, function (err, value) {
                if(err) callback(err);
                else callback(null, value, fileSize);
            });
        },
        //изменяем информацию по загружаемому файлу
        function (value, fileSize, callback) {
            let arrayValue = value.split('/');

            let newValue = arrayValue[0] + '/' + fileSize + '/successfully';
            redis.hset('task_loading_files:' + taskIndexHash, obj.fileName, newValue, function (err) {
                if(err) callback(err);
                else callback(null, true);
            });
        }
    ], function (err) {
        if(err) func(err);
        else func();
    });
};