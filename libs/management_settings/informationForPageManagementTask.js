/**
 * Модуль выполняющий подготовку информации для вывода на странице администрирования приложения
 * 
 * Версия 0.11, дата релиза 22.05.2018
 */

'use strict';

const async = require('async');

const globalObject = require('../../configure/globalObject');

//краткая информация о количестве подключенных сенсоров, выполняемых задач и 'повисших' задачах
module.exports.getShortStatisticInfo = function(redis, func) {
    let sources = globalObject.getData('sources');

    async.parallel({
        countConnectionSources: getCountConnectSources,
        countDisconnectionSources: getCountDisconnectSources,
        countTaskFiltering: getCountTaskFiltering,
        countTaskTurnDownloadingFiles: getTaskTurnDownloadingFiles,
        countTaskImplementationDownloadingFiles: getTaskImplementationDownloadingFiles
    }, function(err, result) {
        if (err) func(err);
        else func(null, result);
    });

    function getCountConnectSources(callback) {
        let arrayConnect = [];

        for (let sourceId in sources) {
            if (sources[sourceId].connectionStatus === 'connect') arrayConnect.push(sourceId);
        }

        callback(null, arrayConnect.length);
    }

    function getCountDisconnectSources(callback) {
        let arrayDisconnect = [];

        for (let sourceId in sources) {
            if (sources[sourceId].connectionStatus === 'connect') arrayDisconnect.push(sourceId);
        }

        callback(null, arrayDisconnect.length);
    }

    function getCountTaskFiltering(callback) {
        let processingTask = globalObject.getDataTaskFilter();
        let processingTasksIndex = Object.keys(processingTask);

        callback(null, processingTasksIndex.length);
    }

    //задачи ожидающие своей очереди для выгрузки сет. трафика
    function getTaskTurnDownloadingFiles(callback) {
        redis.exists('task_turn_downloading_files', function(err, isExists) {
            if (err) return callback(err);
            if (isExists === 0) return callback(null, 0);

            redis.lrange('task_turn_downloading_files', [0, -1], function(err, arrayResult) {
                if (err) callback(err);
                else callback(null, arrayResult.length);
            });
        });
    }

    //выполняющиеся задачи по выгрузке сет. трафика
    function getTaskImplementationDownloadingFiles(callback) {
        redis.exists('task_implementation_downloading_files', function(err, isExists) {
            if (err) return callback(err);
            if (isExists === 0) return callback(null, 0);

            redis.lrange('task_implementation_downloading_files', [0, -1], function(err, arrayResult) {
                if (err) callback(err);
                else callback(null, arrayResult.length);
            });
        });
    }
};