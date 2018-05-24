/*
 * Подготовка всей информации по выбранной задачи фильтрации
 *
 * Версия 0.1, дата релиза 12.05.2016
 * */

'use strict';

const async = require('async');

const writeLogFile = require('./writeLogFile');

module.exports.getAllInformationTaskIndex = function(redis, taskIndex, func) {
    let patternTaskIndex = new RegExp('^[a-zA-Z0-9]{1,}$');
    if (!patternTaskIndex.test(taskIndex)) {
        writeLogFile.writeLog('\tError: incorrect task index');
        return;
    }

    async.waterfall([
        function(callback) {
            redis.hmget('task_filtering_all_information:' + taskIndex,
                'dateTimeStartFilter',
                'userName',
                'sourceId',
                'countCycleComplete',
                'directoryFiltering',
                'countFullCycle',
                'countFilesFound',
                'jobStatus',
                'dateTimeAddTaskFilter',
                'dateTimeEndFilter',
                'uploadFiles',
                'countFilesChunk',
                'countDirectoryFiltering',
                'countFilesFiltering',
                'countFilesProcessed',
                'filterSettings',
                'countMaxFilesSize',
                'countFoundFilesSize',
                'uploadDirectoryFiles',
                'countFilesLoaded',
                'countFilesLoadedError',
                'userNameStartUploadFiles',
                'userNameContinueUploadFiles',
                'userNameStopUploadFiles',
                'dateTimeStartUploadFiles',
                'dateTimeContinueUploadFiles',
                'dateTimeStopUploadFiles',
                'dateTimeEndUploadFiles',
                'userNameLookedThisTask',
                'dateTimeLookedThisTask',
                function(err, result) {
                    if (err) callback(err);
                    else callback(null, {
                        'dateTimeStartFilter': result[0],
                        'userName': result[1],
                        'sourceId': result[2],
                        'countCycleComplete': result[3],
                        'directoryFiltering': result[4],
                        'countFullCycle': result[5],
                        'countFilesFound': result[6],
                        'jobStatus': result[7],
                        'dateTimeAddTaskFilter': result[8],
                        'dateTimeEndFilter': result[9],
                        'uploadFiles': result[10],
                        'countFilesChunk': result[11],
                        'countDirectoryFiltering': result[12],
                        'countFilesFiltering': result[13],
                        'countFilesProcessed': result[14],
                        'filterSettings': result[15],
                        'countMaxFilesSize': result[16],
                        'countFoundFilesSize': result[17],
                        'uploadDirectoryFiles': result[18],
                        'countFilesLoaded': result[19],
                        'countFilesLoadedError': result[20],
                        'userNameStartUploadFiles': result[21],
                        'userNameContinueUploadFiles': result[22],
                        'userNameStopUploadFiles': result[23],
                        'dateTimeStartUploadFiles': result[24],
                        'dateTimeContinueUploadFiles': result[25],
                        'dateTimeStopUploadFiles': result[26],
                        'dateTimeEndUploadFiles': result[27],
                        'userNameLookedThisTask': result[28],
                        'dateTimeLookedThisTask': result[29]
                    });
                });
        },
        function(objTaskIndex, callback) {
            redis.hmget('remote_host:settings:' + objTaskIndex.sourceId,
                'shortName',
                'detailedDescription',
                function(err, result) {
                    if (err) return callback(err);

                    objTaskIndex.shortName = result[0];
                    objTaskIndex.detailedDescription = result[1];
                    callback(null, objTaskIndex);
                });
        }
    ], function(err, result) {
        if (err) {
            writeLogFile.writeLog('\t' + err.toString());
            func({});
        } else {
            func(result);
        }
    });
};