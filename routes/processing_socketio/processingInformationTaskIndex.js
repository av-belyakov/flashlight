/*
 * Управление информацией по выбранной задачи фильтрации
 *
 * - удаление
 *
 * Версия 0.2, дата релиза 29.09.2016
 * */

'use strict';

const async = require('async');

const errorsType = require('../../errors/errorsType');
const controllers = require('../../controllers');
const writeLogFile = require('../../libs/writeLogFile');
const deleteIndex = require('../../libs/management_index/deleteIndex');
const globalObject = require('../../configure/globalObject');

//удаление всей информации по выбранной задачи
exports.deleteInformation = function(socketIo, obj, func) {
    let redis = controllers.connectRedis();

    getSourceId(redis, obj.taskIndex, function(err, sourceId) {
        if (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            return func(socketIo, 'danger', 'Ошибка, невозможно удалить выбранную задачу');
        }

        async.series([
            //проверка выполнения задачи на фильтрацию
            function(done) {
                let processingTasks = globalObject.getDataTaskFilter();

                if (taskIndexIsTrue(obj.taskIndex, Object.keys(processingTasks))) {
                    done(new errorsType.errorDeletingTask('Удаление выбранной задачи не возможна, задача находится на стадии выполнения'));
                } else {
                    done(null, true);
                }
            },
            //проверка очереди на загрузку файлов
            function(done) {
                redis.lrange('task_turn_downloading_files', [0, -1], function(err, arrayTaskIndexTurn) {
                    if (err) return done(err);

                    if (taskIndexIsTrue(sourceId + ':' + obj.taskIndex, arrayTaskIndexTurn)) done(new errorsType.errorDeletingTask('Удаление выбранной задачи не возможна, задача находится на стадии выполнения'));
                    else done(null, true);
                });
            },
            //проверка выполняемых задач по загрузке файлов
            function(done) {
                redis.lrange('task_implementation_downloading_files', [0, -1], function(err, arrayTaskIndexTurn) {
                    if (err) return done(err);

                    if (taskIndexIsTrue(sourceId + ':' + obj.taskIndex, arrayTaskIndexTurn)) done(new errorsType.errorDeletingTask('Удаление выбранной задачи не возможна, задача находится на стадии выполнения'));
                    else done(null, true);
                });
            }
        ], function(err, result) {
            if (err) {
                if (typeof err.name === 'undefined') {
                    writeLogFile.writeLog('\tError: ' + err.toString());
                    func(socketIo, 'danger', 'Ошибка, невозможно удалить выбранную задачу');
                } else {
                    func(socketIo, 'warning', err.message);
                }
            } else {
                async.parallel([
                    //удаляем данные из task_filtering_index_processing_completed
                    function(callback) {
                        redis.lrem('task_filtering_index_processing_completed', [0, obj.taskIndex], function(err) {
                            if (err) callback(err);
                            else callback(null, true);
                        });
                    },
                    //удаляем данные из task_filtering_index_all
                    function(callback) {
                        redis.zrem('task_filtering_index_all', obj.taskIndex, function(err) {
                            if (err) callback(err);
                            else callback(null, true);
                        });
                    },
                    //удаляем таблицу task_filtering_all_information:*
                    function(callback) {
                        redis.del('task_filtering_all_information:' + obj.taskIndex, function(err) {
                            if (err) callback(err);
                            else callback(null, true);
                        });
                    },
                    //удаляем таблицу task_loading_files:*
                    function(callback) {
                        redis.del('task_loading_files:' + obj.taskIndex, function(err) {
                            if (err) callback(err);
                            else callback(null, true);
                        });
                    },
                    //удаление данных из таблиц с псевдоиндексами
                    function(callback) {
                        deleteIndex(redis, obj.taskIndex, function(err) {
                            if (err) callback(err);
                            else callback(null, true);
                        });
                    }
                ], function(err, results) {
                    if (err) {
                        writeLogFile.writeLog('\tError: ' + err.toString());
                        func(socketIo, 'danger', 'Ошибка, невозможно удалить выбранную задачу');
                    } else if (results.every((item) => item)) {
                        func(socketIo, 'info', 'Задача успешно удалена');
                    } else {
                        func(socketIo, 'danger', 'Ошибка, невозможно удалить выбранную задачу');
                    }
                });
            }
        });
    });
};

//получить цифровой идентификатор источника
function getSourceId(redis, taskIndex, funcCallback) {
    let pattern = new RegExp('^[0-9a-zA-Z]+$');
    //проверяем данные полученные от пользователя
    if (!pattern.test(taskIndex)) {
        return funcCallback(new errorsType.receivedIncorrectData('received incorrect data'));
    }

    redis.hget('task_filtering_all_information:' + taskIndex, 'sourceId', function(err, sourceId) {
        if (err) funcCallback(err);
        else funcCallback(null, sourceId);
    });
}

//проверка совпадение индекса задачи
function taskIndexIsTrue(searchTaskIndex, arrayTaskIndex) {
    return arrayTaskIndex.some(function(item) {
        return item === searchTaskIndex;
    });
}