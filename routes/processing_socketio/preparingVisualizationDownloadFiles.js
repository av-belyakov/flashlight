/*
 * Подготовка к визуализации хода выполнения загрузки файлов
 *
 * Версия 0.1, дата релиза 26.09.2016
 * */

'use strict';

const async = require('async');

//const errorsType = require('../../errors/errorsType');
const writeLogFile = require('../../libs/writeLogFile');

const objGlobal = {};

//подготовка данных необходимых для визуализации добавления в очередь задачи на выгрузку файлов
module.exports.preparingVisualizationAddTurn = function(redis, taskIndex, sourceID, func) {
    getShortSourcesInformationTurn(redis, taskIndex, sourceID, (err, obj) => {
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
module.exports.preparingVisualizationStartExecute = function(redis, taskIndex, sourceID, func) {
    getShortSourcesInformationImplementation(redis, taskIndex, sourceID, (err, obj) => {
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
module.exports.preparingVisualizationUpdateProgress = function(redis, remoteHostIp, sourceID, func) {
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
module.exports.preparingVisualizationExecuteCompleted = function(redis, taskIndex, sourceID, func) {
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
module.exports.preparingVisualizationComplete = function(redis, taskIndex, sourceID, func) {
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
function getShortSourcesInformationImplementation(redis, taskIndex, sourceID, done) {
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
                redis.hmget(`task_filtering_all_information:${taskIndex}`,
                    'countFilesFound',
                    'countFilesLoaded',
                    'countFilesLoadedError',
                    (err, arrayData) => {
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
                redis.hget(`remote_host:settings:${sourceID}`, 'shortName', function(err, shortName) {
                    if (err) callback(err);
                    else callback(null, obj, shortName);
                });
            }
        ], (err, obj, shortName) => {
            if (err) return done(err);

            obj.taskIndex = taskIndex;
            obj.sourceId = sourceID;
            obj.shortName = shortName;

            done(null, obj);
        });
    });
}

//получаем краткую информацию об источнике который находится в очереди
function getShortSourcesInformationTurn(redis, taskIndex, sourceID, done) {
    redis.exists('task_turn_downloading_files', (err, isExists) => {
        if (err) return done(err);

        if (isExists === 0) {
            getInformationForTask('task_implementation_downloading_files', (err, obj) => {
                if (err) done(err);
                else done(null, obj);
            });
        } else {
            getInformationForTask('task_turn_downloading_files', (err, obj) => {
                if (err) done(err);
                else done(null, obj);
            });
        }

        function getInformationForTask(tableNameTask, func) {
            redis.lrange(tableNameTask, [0, -1], (err, arrayResult) => {
                if (err) return func(err);

                let isExistTaskIndex = arrayResult.some((item) => {

                    console.log('---- table ' + tableNameTask + ' task ID = ' + item);

                    if (~item.indexOf(':')) return (item === sourceID + ':' + taskIndex);
                    return false;
                });

                //если идентификатор задачи не был найден
                if (!isExistTaskIndex) return func(null, {});

                async.waterfall([
                    //получаем содержимое таблицы task_filtering_all_information:*
                    function(callback) {
                        redis.hmget(`task_filtering_all_information:${taskIndex}`,
                            'countFilesFound',
                            'countFilesLoaded',
                            (err, arrayData) => {
                                if (err) callback(err);
                                else callback(null, sourceID, {
                                    'countFilesFound': arrayData[0],
                                    'countFilesLoaded': arrayData[1]
                                });
                            });
                    },
                    //получаем краткое название источника
                    function(sourceID, obj, callback) {
                        redis.hget(`remote_host:settings:${sourceID}`, 'shortName', (err, shortName) => {
                            if (err) callback(err);
                            else callback(null, obj, shortName);
                        });
                    }
                ], (err, obj, shortName) => {
                    if (err) return func(err);

                    obj.taskIndex = sourceID + ':' + taskIndex;
                    obj.sourceId = sourceID;
                    obj.shortName = shortName;

                    func(null, obj);
                });
            });
        }
    });
}

//получаем краткую информацию об источнике с которого загрузка файлов была завершена
function getShortSourcesInformationComplete(redis, taskIndex, sourceID, done) {
    async.waterfall([
        //получаем содержимое таблицы task_filtering_all_information:*
        function(callback) {
            redis.hmget(`task_filtering_all_information:${taskIndex}`,
                'countFilesFound',
                'countFilesLoaded',
                (err, arrayData) => {
                    if (err) callback(err);
                    else callback(null, {
                        'countFilesFound': arrayData[0],
                        'countFilesLoaded': arrayData[1]
                    });
                });
        },
        //получаем краткое название источника
        function(obj, callback) {
            redis.hget(`remote_host:settings:${sourceID}`, 'shortName', (err, shortName) => {
                if (err) callback(err);
                else callback(null, obj, shortName);
            });
        }
    ], (err, obj, shortName) => {
        if (err) return done(err);

        obj.taskIndex = taskIndex;
        obj.sourceId = sourceID;
        obj.shortName = shortName;

        done(null, obj);
    });
}