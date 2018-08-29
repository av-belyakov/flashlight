/*
 * Проверка очереди на выгрузку файлов (таблица task_turn_downloading_files)
 * запуск новой задачи на выгрузку файлов если данная задача находится в очереди
 *
 * Версия 0.1, дата релиза 20.09.2016
 * */

'use strict';

const async = require('async');

const errorsType = require('../../errors/errorsType');

module.exports = function(redis, sourceID, callback) {

    console.log('function checkQueueTaskDownloadFiles');

    new Promise((resolve, reject) => {
        redis.exists('task_turn_downloading_files', (err, result) => {
            if (err) reject(err);
            else resolve((result === 0));
        });
    }).then(isExist => {
        console.log('isExist = ' + isExist);

        return new Promise((resolve, reject) => {
            if (isExist) return resolve([]);

            //проверяем таблицу с очередью
            redis.lrange('task_turn_downloading_files', [0, -1], (err, arrayTurn) => {
                if (err) reject(err);
                else {
                    console.log('arrayTurn ==== ');
                    console.log(arrayTurn);

                    resolve(arrayTurn);
                }
            });
        });
    }).then(listTurnDownloadFiles => {

        console.log('function checkQueueTaskDownloadFiles.js');
        console.log(listTurnDownloadFiles);

        if (listTurnDownloadFiles.length === 0) return [];

        let arraySourceIdTurnIsExists = listTurnDownloadFiles.filter(item => item.split(':')[0] === sourceID);

        return arraySourceIdTurnIsExists;
    }).then(arraySourceIdTurnIsExists => {
        return new Promise((resolve, reject) => {
            if (arraySourceIdTurnIsExists.length === 0) return callback(null, {});

            //проверяем таблицу выполняющихся задач
            redis.lrange('task_implementation_downloading_files', [0, -1], (err, arrayImplementation) => {
                if (err) reject(err);
                else resolve({
                    listImplementation: arrayImplementation,
                    listSourceTurn: arraySourceIdTurnIsExists
                });
            });
        });
    }).then(({ listImplementation, listSourceTurn }) => {
        let arraySourceIdImplementationIsExists = listImplementation.filter(item => item.split(':')[0] === sourceID);

        if (arraySourceIdImplementationIsExists.length === 0) {
            startNewTaskDownloadFiles(redis, listSourceTurn[0], (err, objTaskIndex) => {
                if (err) throw (err);
                else callback(null, objTaskIndex);
            });
        }
    }).catch(err => {
        callback(err);
    });
};

//запуск новой задачи по выгузке файлов
function startNewTaskDownloadFiles(redis, taskIndex, func) {
    if (!(~taskIndex.indexOf(':'))) return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', ''));

    let taskIndexHash = taskIndex.split(':')[1];

    async.series([
        //изменяем время начала загрузки файлов, таблица task_filtering_all_information:*
        function(callback) {
            redis.hset('task_filtering_all_information:' + taskIndexHash, 'dateTimeStartUploadFiles', +new Date(), function(err) {
                if (err) callback(err);
                else callback(null);
            });
        },
        //удаляем задачу из таблице task_turn_downloading_files
        function(callback) {
            redis.lrem('task_turn_downloading_files', 0, taskIndex, function(err) {
                if (err) callback(err);
                else callback(null);
            });
        },
        //добавляем задачу в таблицу task_implementation_downloading_files
        function(callback) {
            redis.rpush('task_implementation_downloading_files', taskIndex, function(err) {
                if (err) callback(err);
                else callback(null);
            });
        }
    ], function(err) {
        if (err) return func(err);

        //получаем необходимую информацию для формирования запроса о начале загрузки файлов
        redis.hmget(`task_filtering_all_information:${taskIndexHash}`,
            'countFilesFound',
            'directoryFiltering',
            (err, result) => {
                if (err) func(err);
                else func(null, {
                    'messageType': 'download files',
                    'processing': 'start',
                    'taskIndex': taskIndex,
                    'countFilesFound': result[0],
                    'directoryFiltering': result[1]
                });
            });
    });
}