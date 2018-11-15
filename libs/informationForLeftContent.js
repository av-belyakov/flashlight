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

    let listIndex = Object.keys(processingTasks).filter(taskID => {
        if (typeof processingTasks[taskID].status === 'undefined' || processingTasks[taskID].status === null) return false;
        if (processingTasks[taskID].status === 'expect') return true;

        return false;
    });

    async.map(listIndex, (taskIndex, callbackMap) => {
        redis.hmget(`task_filtering_all_information:${taskIndex}`,
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
module.exports.listTurnDownloadFiles = function(redis, cb) {
    redis.lrange('task_turn_downloading_files', [0, -1], (err, arrayResult) => {
        if (err) {
            writeLogFile.writeLog(`\tError: ${err.toString()}`);
            return cb({});
        }

        let objResult = getShortSourcesInformation(arrayResult);

        cb(objResult);
    });
};

//получить информацию по уже выполняющимся задачам по выгрузке файлов
module.exports.listImplementationDownloadFiles = function(redis, cb) {
    redis.lrange('task_implementation_downloading_files', [0, -1], (err, arrayResult) => {
        if (err) {
            writeLogFile.writeLog(`\tError: ${err.toString()}`);
            return cb({});
        }

        let objResult = getShortSourcesInformation(arrayResult);
        for (let taskIndex in objResult) {
            let infoDownloadFiles = globalObject.getInformationDownloadFiles(objResult[taskIndex].ipaddress).fileUploadedPercent;
            if (typeof infoDownloadFiles === 'undefined') {
                continue;
            }

            objResult[taskIndex].fileUploadedPercent = infoDownloadFiles.fileUploadedPercent;
        }

        cb(objResult);
    });
};

//получаем краткую информацию по источникам с которых выполняется загрузка
function getShortSourcesInformation(arrayResult) {
    let finalyResult = {};

    arrayResult.forEach(element => {
        if (!~element.indexOf(':')) return;

        let taskIndex = element.split(':')[1];

        let pti = globalObject.getData('processingTasks', taskIndex);
        if (typeof pti.sourceId === 'undefined') return;

        finalyResult[taskIndex] = {
            'sourceId': pti.sourceId,
            'countFilesFound': pti.uploadInfo.numberFilesUpload,
            'countFilesLoaded': pti.uploadInfo.numberFilesUploaded,
            'countFilesLoadedError': pti.uploadInfo.numberFilesUploadedError
        };

        let sourceInfo = globalObject.getData('sources', pti.sourceId);

        finalyResult[taskIndex].shortName = sourceInfo.shortName;
        finalyResult[taskIndex].ipaddress = sourceInfo.ipaddress;
    });

    console.log('++++++++ getShortSourcesInformation +++++++++');
    console.log(finalyResult);

    return finalyResult;
}