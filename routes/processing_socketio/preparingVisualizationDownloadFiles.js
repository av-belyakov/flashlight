/*
 * Подготовка к визуализации хода выполнения загрузки файлов
 *
 * Версия 0.1, дата релиза 26.09.2016
 * */

'use strict';

const async = require('async');

const errorsType = require('../../errors/errorsType');
const writeLogFile = require('../../libs/writeLogFile');

const objGlobal = {};

//подготовка данных необходимых для визуализации добавления в очередь задачи на выгрузку файлов
module.exports.preparingVisualizationAddTurn = function(redis, taskIndex, func) {
    getShortSourcesInformationTurn(redis, taskIndex, function(err, obj) {
        if (err) {
            if (err.name === 'Error') writeLogFile.writeLog('\tError: ' + err.toString());
            else writeLogFile.writeLog('\tError: ' + err.message.toString());

            func(err);
        } else {
            func(null, obj);
        }
    });
};

//подготовка данных необходимых для визуализации начала загрузки файлов
module.exports.preparingVisualizationStartExecute = function(redis, taskIndex, func) {
    getShortSourcesInformationImplementation(redis, taskIndex, function(err, obj) {
        if (err) {
            if (err.name === 'Error') writeLogFile.writeLog('\tError: ' + err.toString());
            else writeLogFile.writeLog('\tError: ' + err.message.toString());

            func(err);
        } else {
            func(null, obj);
        }
    });
};

//подготовка данных для визуализации прогресса
module.exports.preparingVisualizationUpdateProgress = function(redis, remoteHostIp, func) {
    for (let sourceIp in objGlobal.downloadFilesTmp) {
        if (remoteHostIp === sourceIp) {
            getShortSourcesInformationImplementation(
                redis,
                objGlobal.downloadFilesTmp[sourceIp].taskIndex, (err, obj) => {
                    if (err) {
                        if (err.name === 'Error') writeLogFile.writeLog('\tError: ' + err.toString());
                        else writeLogFile.writeLog('\tError: ' + err.message.toString());

                        func(err);
                    } else {
                        obj.fileUploadedPercent = 0;
                        if (typeof objGlobal.downloadFilesTmp[sourceIp] !== 'undefined') {
                            if (typeof objGlobal.downloadFilesTmp[sourceIp].fileUploadedPercent !== 'undefined') {
                                obj.fileUploadedPercent = objGlobal.downloadFilesTmp[sourceIp].fileUploadedPercent;
                            }
                        }
                        func(null, obj);
                    }
                });
        } else {
            func(null, {});
        }
    }
};

//подготовка данных необходимых для визуализации загрузки файла
module.exports.preparingVisualizationExecuteCompleted = function(redis, taskIndex, func) {
    getShortSourcesInformationImplementation(redis, taskIndex, function(err, obj) {
        if (err) {
            if (err.name === 'Error') writeLogFile.writeLog('\tError: ' + err.toString());
            else writeLogFile.writeLog('\tError: ' + err.message.toString());

            func(err);
        } else {
            obj.fileUploadedPercent = 100;

            func(null, obj);
        }
    });
};

//подготовка данных для визуализации окончания загрузки
module.exports.preparingVisualizationComplete = function(redis, taskIndex, func) {
    getShortSourcesInformationComplete(redis, taskIndex, function(err, obj) {
        if (err) {
            if (err.name === 'Error') writeLogFile.writeLog('\tError: ' + err.toString());
            else writeLogFile.writeLog('\tError: ' + err.message.toString());

            func(err);
        } else {
            func(null, obj);
        }
    });
};

//получаем краткую информацию об источнике с которого выполняется загрузка
function getShortSourcesInformationImplementation(redis, taskIndex, done) {
    if (!(~taskIndex.indexOf(':'))) return done(new errorsType.receivedIncorrectData('Ошибка: некорректный идентификатор источника'));

    let [sourceId, hashTaskIndex] = taskIndex.split(':');

    redis.lrange('task_implementation_downloading_files', [0, -1], function(err, arrayResult) {
        if (err) return done(err);

        let isExistTaskIndex = arrayResult.some((item) => {
            if (~item.indexOf(':')) return (item === taskIndex);
            return false;
        });

        //если идентификатор задачи не был найден
        if (!isExistTaskIndex) return done(null, {});

        async.waterfall([
            //получаем содержимое таблицы task_filtering_all_information:*
            function(callback) {
                redis.hmget('task_filtering_all_information:' + hashTaskIndex,
                    'countFilesFound',
                    'countFilesLoaded',
                    'countFilesLoadedError',
                    function(err, arrayData) {
                        if (err) callback(err);
                        else callback(null, {
                            'countFilesFound': arrayData[0],
                            'countFilesLoaded': arrayData[1],
                            'countFilesLoadedError': arrayData[2]
                        });
                    });
            },
            //получаем краткое название источника
            function(obj, callback) {
                redis.hget('remote_host:settings:' + sourceId, 'shortName', function(err, shortName) {
                    if (err) callback(err);
                    else callback(null, obj, shortName);
                });
            }
        ], function(err, obj, shortName) {
            if (err) return done(err);

            obj.taskIndex = taskIndex;
            obj.sourceId = sourceId;
            obj.shortName = shortName;

            done(null, obj);
        });
    });
}

//получаем краткую информацию об источнике который находится в очереди
function getShortSourcesInformationTurn(redis, taskIndex, done) {
    redis.exists('task_turn_downloading_files', function(err, isExists) {
        if (err) return done(err);

        if (isExists === 0) {
            getInformationForTask('task_implementation_downloading_files', function(err, obj) {
                if (err) done(err);
                else done(null, obj);
            });
        } else {
            getInformationForTask('task_turn_downloading_files', function(err, obj) {
                if (err) done(err);
                else done(null, obj);
            });
        }

        function getInformationForTask(tableNameTask, func) {
            redis.hget('task_filtering_all_information:' + taskIndex, 'sourceId', function(err, sourceId) {
                if (err) return func(err);

                redis.lrange(tableNameTask, [0, -1], function(err, arrayResult) {
                    if (err) return func(err);

                    let isExistTaskIndex = arrayResult.some((item) => {
                        if (~item.indexOf(':')) return (item === sourceId + ':' + taskIndex);
                        return false;
                    });

                    //если идентификатор задачи не был найден
                    if (!isExistTaskIndex) return func(null, {});

                    async.waterfall([
                        //получаем содержимое таблицы task_filtering_all_information:*
                        function(callback) {
                            redis.hmget('task_filtering_all_information:' + taskIndex,
                                'countFilesFound',
                                'countFilesLoaded',
                                function(err, arrayData) {
                                    if (err) callback(err);
                                    else callback(null, sourceId, {
                                        'countFilesFound': arrayData[0],
                                        'countFilesLoaded': arrayData[1]
                                    });
                                });
                        },
                        //получаем краткое название источника
                        function(sourceId, obj, callback) {
                            redis.hget('remote_host:settings:' + sourceId, 'shortName', function(err, shortName) {
                                if (err) callback(err);
                                else callback(null, obj, shortName, sourceId);
                            });
                        }
                    ], function(err, obj, shortName, sourceId) {
                        if (err) return func(err);

                        obj.taskIndex = sourceId + ':' + taskIndex;
                        obj.sourceId = sourceId;
                        obj.shortName = shortName;

                        func(null, obj);
                    });
                });
            });
        }
    });
}

//получаем краткую информацию об источнике с которого загрузка файлов была завершена
function getShortSourcesInformationComplete(redis, taskIndex, done) {
    let [sourceId, hashIndex] = taskIndex.split(':');

    async.waterfall([
        //получаем содержимое таблицы task_filtering_all_information:*
        function(callback) {
            redis.hmget('task_filtering_all_information:' + hashIndex,
                'countFilesFound',
                'countFilesLoaded',
                function(err, arrayData) {
                    if (err) callback(err);
                    else callback(null, {
                        'countFilesFound': arrayData[0],
                        'countFilesLoaded': arrayData[1]
                    });
                });
        },
        //получаем краткое название источника
        function(obj, callback) {
            redis.hget('remote_host:settings:' + sourceId, 'shortName', function(err, shortName) {
                if (err) callback(err);
                else callback(null, obj, shortName);
            });
        }
    ], function(err, obj, shortName) {
        if (err) return done(err);

        obj.taskIndex = taskIndex;
        obj.sourceId = sourceId;
        obj.shortName = shortName;

        done(null, obj);
    });
}