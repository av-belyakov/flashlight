/**
 * Модуль обработки отмены еще не выполняемой задачи по скачивания файлов
 * 
 * Версия 0.1, дата релиза 03.10.2018
 */

'use strict';

const async = require('async');

const showNotify = require('../../libs/showNotify');
const checkAccessRights = require('../../libs/users_management/checkAccessRights');

/**
 * 
 * @param {*} taskIndex ID задачи
 * @param {*} socketIo дискриптор соединения через протокол socketIo
 * @param {*} redis дискриптор соединения с БД
 * @param {*} cb функция обратного вызова
 */
module.exports = function(taskIndex, socketIo, redis, cb) {

    console.log('TASK DOWNLOAD FILES "CANCEL!!!"');


    new Promise((resolve, reject) => {
        checkAccessRights(socketIo, 'management_tasks_import', 'cancel', function(trigger) {
            if (!trigger) reject(new Error('Не достаточно прав доступа для останова задачи по загрузке найденных файлов'));
            else resolve();
        }).then(() => {
            return new Promise((resolve, reject) => {
                redis.hget(`task_filtering_all_information:${taskIndex}`, 'sourceId', (err, sourceID) => {
                    if (err) reject(err);
                    else resolve(sourceID);
                });
            });
        }).then(sourceID => {
            let taskIDDownloadFiles = `${sourceID}:${taskIndex}`;

            async.parallel([
                //удаляем элемент из таблицы task_turn_downloading_files
                (callback) => {
                    redis.lrem('task_turn_downloading_files', 0, taskIDDownloadFiles, err => {
                        if (err) callback(err);
                        else callback(null, true);
                    });
                },
                //удаляем элемент из таблицы task_implementation_downloading_files
                (callback) => {
                    redis.lrem('task_implementation_downloading_files', 0, taskIDDownloadFiles, err => {
                        if (err) callback(err);
                        else callback(null, true);
                    });
                },
                (callback) => {
                    redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                        'uploadFiles': 'not loaded',
                        'uploadDirectoryFiles': 'null',
                        'userNameStartUploadFiles': 'null',
                        'dateTimeStartUploadFiles': 'null'
                    }, err => {
                        if (err) callback(err);
                        else callback(null, true);
                    });
                }
            ], function(err) {
                if (err) throw (err);
                else return;
            });
        }).then(() => {
            cb(null);
        }).catch(err => {
            cb(err);
        });
    });
};