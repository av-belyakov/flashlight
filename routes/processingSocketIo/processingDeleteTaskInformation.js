/*
* Удаления всей информации по выбранной задаче,
* при необходимости так же удаляются все загруженные файлы и созданные директории
*
* Версия 0.1, дата релиза 13.12.2016
* */

'use strict';

const fs = require('fs');
const async = require('async');

const errorsType = require('../../errors/errorsType');
const writeLogFile = require('../../libs/writeLogFile');
const deleteIndex = require('../../libs/management_index/deleteIndex');

module.exports = function (redis, obj, func) {
    let pattern = new RegExp('^[0-9a-zA-Z]+$');
    //проверяем данные полученные от пользователя
    if(!pattern.test(obj.taskIndex)){
        writeLogFile.writeLog('\tError: Неверный идентификатор задачи, получены некорректные данные');
        return func(new errorsType.receivedIncorrectData('received incorrect data'));
    }

    redis.hmget('task_filtering_all_information:' + obj.taskIndex, 'sourceId', 'uploadDirectoryFiles', function (err, result) {
        if(err){
            writeLogFile.writeLog('\tError: ' + err.toString());
            return func(err);
        }

        let [sourceId, uploadDirectoryFiles] = result;
        async.parallel([
            //удаляем данные из task_filtering_index_processing_completed
            function (callback) {
                redis.lrem('task_filtering_index_processing_completed', [0, obj.taskIndex], function (err) {
                    if(err) callback(err);
                    else callback(null);
                });
            },
            //удаляем данные из task_filtering_index_all
            function (callback) {
                redis.zrem('task_filtering_index_all', obj.taskIndex, function (err) {
                    if(err) callback(err);
                    else callback(null);
                })
            },
            //удаляем таблицу task_filtering_all_information:*
            function (callback) {
                redis.del('task_filtering_all_information:' + obj.taskIndex, function (err) {
                    if(err) callback(err);
                    else callback(null);
                });
            },
            //удаляем таблицу task_loading_files:*
            function (callback) {
                redis.del('task_loading_files:' + obj.taskIndex, function (err) {
                    if(err) callback(err);
                    else callback(null);
                });
            },
            //удаление данных из таблиц с псевдоиндексами
            function (callback) {
                deleteIndex(redis, obj.taskIndex, function (err) {
                    if(err) callback(err);
                    else callback(null);
                });
            },
            //удаление псевдоиндекса из таблицы task_filtering_upload_not_considered
            function (callback) {
                redis.zrem('task_filtering_upload_not_considered', sourceId + ':' + obj.taskIndex, function (err) {
                    if(err) callback(err);
                    else callback(null);
                });
            },
            //если obj.deleteAllFiles в состоянии true тогда дополнительно удаляем все файлы и директории
            function (callback) {
                if(!obj.deleteAllFile) return callback(null);

                removePassedDirectory(uploadDirectoryFiles, function (err) {
                    if(err) callback(err);
                    else callback(null);
                });
            }
        ], function (err) {
            if(err){
                writeLogFile.writeLog('\tError: ' + err.toString());
                func(err);
            } else {
                redis.zrange('task_filtering_upload_not_considered', [0, -1], function (err, listTaskUpload) {
                    if(err) func(err);
                    else func(null, listTaskUpload.length);
                });
            }
        });
    });
};

//удаление директории с загруженными файлами
function removePassedDirectory (directoryFiltering, func) {
    fs.readdir(directoryFiltering, function (err, files) {
        if(err) return func(err);

        async.each(files, function (file, callbackEach) {
            file = directoryFiltering + '/' + file;
            fs.stat(file, function (err, stat) {
                if(err) return callbackEach(err);

                if(stat.isDirectory()){
                    removePassedDirectory(file, callbackEach);
                } else {
                    fs.unlink(file, function (err) {
                        if(err) callbackEach(err);
                        else callbackEach(null);
                    })
                }
            })
        }, function (err) {
            if(err) return func(err);

            fs.rmdir(directoryFiltering, function (err) {
                if(err) func(err);
                else func(null);
            })
        });
    });
}