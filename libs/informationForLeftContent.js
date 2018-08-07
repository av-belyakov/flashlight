/*
 * Формирование информации для левой панели основного контента
 *
 * Версия 0.11, дата релиза 23.05.2018
 * */

'use strict';

const async = require('async');

const writeLogFile = require('./writeLogFile');
const globalObject = require('../configure/globalObject');

//список задач по фильтрации файлов
module.exports.listFilterHosts = function(redis, func) {
    let processingTasks = globalObject.getDataTaskFilter();
    let obj = {};

    async.map(Object.keys(processingTasks), (taskIndex, callbackMap) => {
        redis.hmget('task_filtering_all_information:' + taskIndex,
            'sourceId',
            'countCycleComplete',
            'countFilesFiltering',
            'countFilesChunk',
            'countFilesFound',
            'countFilesProcessed',
            (err, result) => {
                if (err) return callbackMap(err);

                obj[taskIndex] = {
                    sourceId: result[0],
                    countCycleComplete: result[1],
                    countFilesFiltering: result[2],
                    countFilesChunk: result[3],
                    countFilesFound: result[4],
                    countFilesProcessed: result[5]
                };
                callbackMap(null, obj);
            });
    }, (err, result) => {
        if (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            func({});
        } else {
            func(result[0]);
        }
    });
};

//получить информацию по задачам стоящим в очереди на загрузку файлов
module.exports.listTurnDownloadFiles = function(redis, func) {
    async.waterfall([
        //получаем список задач ожидающих своей очереди
        function(callback) {
            redis.lrange('task_turn_downloading_files', [0, -1], function(err, arrayResult) {
                if (err) callback(err);
                else callback(null, arrayResult);
            });
        },
        //получаем краткую информацию по задачам находящимся в очереди
        function(arrayResult, callback) {
            getShortSourcesInformation(redis, arrayResult, function(err, result) {
                if (err) callback(err);
                else callback(null, result);
            });
        }
    ], function(err, objResult) {
        if (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            func({});
        } else {
            func(objResult);
        }
    });
};

//получить информацию по уже выполняющимся задачам по выгрузке файлов
module.exports.listImplementationDownloadFiles = function(redis, func) {
    async.waterfall([
        //получаем список выполняющихся задач
        function(callback) {
            redis.lrange('task_implementation_downloading_files', [0, -1], function(err, arrayResult) {
                if (err) callback(err);
                else callback(null, arrayResult);
            });
        },
        //получаем краткую информацию по выполняющимся задачам
        function(arrayResult, callback) {
            getShortSourcesInformation(redis, arrayResult, function(err, result) {
                if (err) callback(err);
                else callback(null, result);
            });
        },
        //получаем размер загружаемого файла, количество уже загруженных данных, шаг в байтах
        function(objResult, callback) {
            for (let taskIndex in objResult) {
                let infoDownloadFiles = globalObject.getInformationDownloadFiles(objResult[taskIndex].ipaddress).fileUploadedPercent;
                if (typeof infoDownloadFiles.fileUploadedPercent === 'undefined') {
                    continue;
                }

                objResult[taskIndex].fileUploadedPercent = infoDownloadFiles.fileUploadedPercent;
            }
            callback(null, objResult);
        }
    ], function(err, objResult) {
        if (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            func({});
        } else {
            func(objResult);
        }
    });
};

//получаем краткую информацию по источникам с которых выполняется загрузка
function getShortSourcesInformation(redis, arrayResult, done) {
    let obj = {};
    async.map(arrayResult, (item, callbackMap) => {
        if (!~item.indexOf(':')) return callbackMap(new Error('invalid ID received'));

        let { sourceID, taskIndex } = item.split(':');

        new Promise((resolve, reject) => {
            redis.hmget(`task_filtering_all_information:${taskIndex}`,
                'sourceId',
                'countFilesFound',
                'countFilesLoaded',
                'countFilesLoadedError', (err, objResult) => {
                    if (err) reject(err);
                    else resolve(objResult);
                });
        }).then((infoAll) => {
            return new Promise((resolve, reject) => {
                redis.hmget((`remote_host:settings:${sourceID}`,
                    'shortName',
                    'ipaddress', (err, infoSource) => {
                        if (err) return reject(err);

                        obj[taskIndex] = {};
                        Object.assign(obj[item], infoAll, infoSource);

                        resolve(obj[taskIndex]);
                    }));
            });
        }).then((result) => {
            callbackMap(null, result);
        }).catch((err) => {
            callbackMap(err);
        });
    }, function(err, objResult) {
        if (err) return done(err);

        let result = (objResult.length === 0) ? {} : objResult[0];
        done(null, result);
    });
}

//получаем краткую информацию по источникам ожидающим загрузку
/*function getShortSourcesInformationTurn(redis, arrayResult, done) {
    let obj = {};

    async.map(arrayResult, function(item, callbackMap) {
        let arrTmp = item.split(':');
        let sourceId = arrTmp[0];
        let taskIndex = arrTmp[1];

        redis.hmget('task_filtering_all_information:' + taskIndex,
            'sourceId',
            'countFilesFound',
            function(err, arrayData) {
                if (err) return callbackMap(err);

                redis.hget('remote_host:settings:' + sourceId, 'shortName', function(error, shortName) {
                    if (error) return callbackMap(error);

                    obj[item] = {
                        'sourceId': arrayData[0],
                        'countFilesFound': arrayData[1],
                        'shortName': shortName
                    };
                    callbackMap(null, obj);
                });
            });

    }, function(err, objResult) {
        if (err) return done(err);

        let result = (objResult.length === 0) ? {} : objResult[0];
        done(null, result);
    });
}
*/