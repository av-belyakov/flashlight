/*
 * Проверка очереди на выгрузку файлов (таблица task_turn_downloading_files)
 * запуск новой задачи на выгрузку файлов если данная задача находится в очереди
 *
 * Версия 0.1, дата релиза 20.09.2016
 * */

'use strict';

const async = require('async');

const errorsType = require('../../errors/errorsType');

module.exports = function(redis, obj, func) {
    if (!(~obj.taskIndex.indexOf(':'))) return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', ''));

    let sourceId = obj.taskIndex.split(';')[0];

    //проверяем существование таблицы task_turn_downloading_files
    redis.exists('task_turn_downloading_files', function(err, result) {
        if (err) return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
        if (result === 0) return func(null, false);

        //проверяем таблицу с очередью
        redis.lrange('task_turn_downloading_files', [0, -1], function(err, arrayTurn) {
            if (err) return func(err);

            let arraySourceIdTurnIsExists = arrayTurn.filter((item) => item.split(':')[0] = sourceId);
            if (arraySourceIdTurnIsExists.length === 0) return func(null, false);

            //проверяе таблицу выполняющихся задач
            redis.lrange('task_implementation_downloading_files', [0, -1], function(err, arrayImplementation) {
                if (err) return func(err);

                let arraySourceIdImplementationIsExists = arrayImplementation.filter((item) => item.split(':')[0] = sourceId);

                if (arraySourceIdImplementationIsExists.length === 0) {
                    startNewTaskDownloadFiles(redis, arraySourceIdTurnIsExists[0], function(err, objTaskIndex) {
                        if (err) func(err);
                        else func(null, objTaskIndex);
                    });
                }
            });
        });
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
                else callback(null, true);
            });
        },
        //удаляем задачу из таблице task_turn_downloading_files
        function(callback) {
            redis.lrem('task_turn_downloading_files', 0, taskIndex, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        },
        //добавляем задачу в таблицу task_implementation_downloading_files
        function(callback) {
            redis.rpush('task_implementation_downloading_files', taskIndex, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        }
    ], function(err, result) {
        if (err) return func(err);

        //получаем необходимую информацию для формирования запроса о начале загрузки файлов
        redis.hmget('task_filtering_all_information:' + taskIndexHash, 'countFilesFound', 'directoryFiltering', function(err, result) {
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