/*
 * Выполняется при получении от источника сообщения
 * messageType: download_files
 * processing: cancel
 *
 * При этом удаляется информация из следующих таблиц
 * - task_turn_downloading_files
 * - task_implementation_downloading_files
 *
 * В таблице task_filtering_all_information:* изменяются следующие поля:
 * - uploadFiles,
 * - uploadDirectoryFiles,
 * - userNameStartUploadFiles,
 * - dateTimeStartUploadFiles
 *
 * Полностью удаляется таблица task_loading_files:*
 *
 * Версия 0.1, дата релиза 16.09.2016
 * */

'use strict';

const async = require('async');

module.exports = function(redis, taskIndex, func) {
    let taskIndexHash = (~taskIndex.indexOf(':')) ? taskIndex.split(':')[1] : taskIndex;

    async.parallel([
        //удаляем элемент из таблицы task_turn_downloading_files
        function(callback) {
            redis.lrem('task_turn_downloading_files', 0, taskIndex, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        },
        //удаляем элемент из таблицы task_implementation_downloading_files
        function(callback) {
            redis.lrem('task_implementation_downloading_files', 0, taskIndex, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        },
        function(callback) {
            redis.hmset('task_filtering_all_information:' + taskIndexHash, {
                'uploadFiles': 'not loaded',
                'uploadDirectoryFiles': 'null',
                'userNameStartUploadFiles': 'null',
                'dateTimeStartUploadFiles': 'null'
            }, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        },
        //удаляем таблицу task_loading_files:*
        function(callback) {
            redis.del('task_loading_files:' + taskIndexHash, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        }
    ], function(err) {
        if (err) func(err);
        else func();
    });
};