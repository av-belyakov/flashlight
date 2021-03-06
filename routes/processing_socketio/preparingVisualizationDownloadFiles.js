/*
 * Подготовка к визуализации хода выполнения загрузки файлов
 *
 * Версия 0.1, дата релиза 14.08.2018
 * */

'use strict';

const async = require('async');

const globalObject = require('../../configure/globalObject');
const writeLogFile = require('../../libs/writeLogFile');

//подготовка данных необходимых для визуализации добавления в очередь задачи на выгрузку файлов
module.exports.preparingVisualizationAddTurn = function(redis, taskIndex, sourceID, cb) {
    getShortSourcesInformationTurn(redis, taskIndex, sourceID, (err, obj) => {
        if (err) {
            if (err.name === 'Error') writeLogFile.writeLog('\tError: ' + err.toString());
            else writeLogFile.writeLog('\tError: ' + err.message.toString());

            cb(err);
        } else {
            cb(null, obj);
        }
    });
};

//подготовка данных необходимых для визуализации начала загрузки файлов
module.exports.preparingVisualizationStartExecute = function(redis, taskIndex, sourceID, cb) {
    getShortSourcesInformationImplementation(redis, taskIndex, sourceID, (err, obj) => {
        if (err) {
            if (err.name === 'Error') writeLogFile.writeLog('\tError: ' + err.toString());
            else writeLogFile.writeLog('\tError: ' + err.message.toString());

            cb(err);
        } else {
            cb(null, obj);
        }
    });
};

//подготовка данных для визуализации прогресса
module.exports.preparingVisualizationUpdateProgress = function(redis, taskIndex, sourceID, cb) {
    let infoDownloadFile = globalObject.getData('downloadFilesTmp', sourceID);

    if ((infoDownloadFile === null) || (typeof infoDownloadFile === 'undefined')) {
        writeLogFile.writeLog('\tError: not found a temporary object \'downloadFilesTmp\' to store information about the download file');

        return cb(null, {});
    }

    getShortSourcesInformationImplementation(redis, taskIndex, sourceID, (err, obj) => {
        if (err) {
            if (err.name === 'Error') writeLogFile.writeLog('\tError: ' + err.toString());
            else writeLogFile.writeLog('\tError: ' + err.message.toString());

            return cb(err);
        }

        obj.fileUploadedPercent = infoDownloadFile.fileUploadedPercent;
        cb(null, obj);
    });
};

//подготовка данных необходимых для визуализации загрузки файла
module.exports.preparingVisualizationExecuteCompleted = function(redis, taskIndex, sourceID, cb) {
    getShortSourcesInformationImplementation(redis, taskIndex, sourceID, (err, obj) => {
        if (err) {
            if (err.name === 'Error') writeLogFile.writeLog('\tError: ' + err.toString());
            else writeLogFile.writeLog('\tError: ' + err.message.toString());

            return cb(err);
        }

        obj.fileUploadedPercent = 100;

        cb(null, obj);
    });
};

//подготовка данных для визуализации окончания загрузки
module.exports.preparingVisualizationComplete = function(redis, taskIndex, sourceID, func) {
    getShortSourcesInformationComplete(redis, taskIndex, sourceID, (err, obj) => {
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
    redis.lrange('task_implementation_downloading_files', [0, -1], (err, arrayResult) => {
        if (err) return done(err);

        let isExistTaskIndex = arrayResult.some(item => item === `${sourceID}:${taskIndex}`);

        //если идентификатор задачи не был найден
        if (!isExistTaskIndex) return done(null, {});

        redis.hget(`remote_host:settings:${sourceID}`, 'shortName', (err, shortName) => {
            if (err) return done(err);

            let objTaskInfo = globalObject.getData('processingTasks', taskIndex);
            let obj = {
                'taskIndex': taskIndex,
                'sourceId': sourceID,
                'shortName': shortName,
                'countFilesFound': objTaskInfo.uploadInfo.numberFilesUpload,
                'countFilesLoaded': objTaskInfo.uploadInfo.numberFilesUploaded,
                'countFilesLoadedError': objTaskInfo.uploadInfo.numberFilesUploadedError
            };

            done(null, obj);
        });
    });
}

//получаем краткую информацию об источнике который находится в очереди
function getShortSourcesInformationTurn(redis, taskIndex, sourceID, done) {
    function getInformationForTask(tableNameTask, func) {
        redis.lrange(tableNameTask, [0, -1], (err, arrayResult) => {
            if (err) return func(err);

            let isExistTaskIndex = arrayResult.some(item => {
                if (~item.indexOf(':')) return (item === `${sourceID}:${taskIndex}`);
                return false;
            });

            //если идентификатор задачи не был найден
            if (!isExistTaskIndex) return func(null, {});

            redis.hget(`remote_host:settings:${sourceID}`, 'shortName', (err, shortName) => {
                if (err) return func(err);

                let obj = {
                    'taskIndex': taskIndex,
                    'sourceId': sourceID,
                    'shortName': shortName,
                    'countFilesFound': 0,
                    'countFilesLoaded': 0
                };
                let objTaskInfo = globalObject.getData('processingTasks', taskIndex);
                if (typeof objTaskInfo === 'undefined') return func(null, obj);

                obj.countFilesFound = objTaskInfo.uploadInfo.numberFilesUpload;
                obj.countFilesLoaded = objTaskInfo.uploadInfo.numberFilesUploaded;

                func(null, obj);
            });
        });
    }

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