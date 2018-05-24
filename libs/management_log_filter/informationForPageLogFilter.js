/*
 * Поиск информации о задачах на фильтрацию
 *
 * Версия 0.1, дата релиза 25.05.2016
 * */

'use strict';

const async = require('async');

const writeLogFile = require('../writeLogFile');
const searchEnginesLogFilter = require('../search_engines/searchEnginesLogFilter');
const objResultFindTaskFilter = require('../../configure/objResultFindTaskFilter');

/*
 * objReq.userId,
 * objReq.objSearchInformation,
 * objReq.isNewReq,
 * objReq.chunkNumber
 * */

module.exports.getAllInformation = function(redis, objReq, func) {

    const MAX_COUNT_TASK_INDEX = 14;

    if (objReq.isNewReq === true) {
        //получить информацию для первой страницы или при поиске
        getStartInformationTaskIndex(function(err, result) {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                func({});
            } else {
                func(result);
            }
        });
    }
    if (objReq.isNewReq === false) {
        //получить информацию при переходе по постраничным ссылкам
        getInformationForChoicePage(function(err, result) {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                func({});
            } else {
                func(result);
            }
        });
    }

    /* получить информацию для первой страницы или при поиске */
    function getStartInformationTaskIndex(callFunc) {
        async.waterfall([
            //поиск данных
            function(callback) {
                searchEnginesLogFilter.search(redis, objReq.objSearchInformation, function(err, arrayTasks) {
                    if (err) callback(err);
                    else callback(null, arrayTasks);
                });
            },
            //получить массив из частей идентификаторов задач
            function(arrayTasks, callback) {
                if (arrayTasks.length === 0) return callback(new Error('arrayTasks is empty'));

                let arrayTasksLength = arrayTasks.length;

                let countChunks = Math.ceil(arrayTasksLength / MAX_COUNT_TASK_INDEX);
                var newArray = [];
                for (let num = 0; num < countChunks; num++) {
                    newArray[num] = arrayTasks.splice(0, MAX_COUNT_TASK_INDEX);
                }

                callback(null, arrayTasksLength, newArray, countChunks);
            },
            //записать части идентификаторов задач в объект objResultFindTaskFilter
            function(countTasks, newArray, countChunks, callback) {
                objResultFindTaskFilter[objReq.userId] = newArray;
                objResultFindTaskFilter[objReq.userId].countTasks = countTasks;

                callback(null, objResultFindTaskFilter[objReq.userId][0], countChunks);
            },
            //получить информацию по первой части идентификаторов задач
            function(chunkTaskIndex, countChunks, callback) {

                var objInformationTasks = {};
                async.map(chunkTaskIndex, function(id, callbackMap) {
                    redis.hmget('task_filtering_all_information:' + id,
                        'dateTimeAddTaskFilter',
                        'sourceId',
                        'userName',
                        'jobStatus',
                        'uploadFiles',
                        'filterSettings',
                        'countFilesFound',
                        function(err, data) {
                            if (err) return callbackMap(err);

                            objInformationTasks[id] = {
                                dateTimeAddTaskFilter: data[0],
                                sourceId: data[1],
                                userName: data[2],
                                jobStatus: data[3],
                                uploadFiles: data[4],
                                filterSettings: data[5],
                                countFilesFound: data[6]
                            };

                            callbackMap(null, {
                                informationTaskIndex: objInformationTasks,
                                informationPaginate: {
                                    maxCountElementsIndex: MAX_COUNT_TASK_INDEX,
                                    chunksNumber: 1,
                                    countChunks: countChunks,
                                    countElements: objResultFindTaskFilter[objReq.userId].countTasks
                                }
                            });
                        });
                }, function(err, arrayResult) {
                    if (err) callback(err);
                    else callback(null, arrayResult[0]);
                });
            }
        ], function(err, result) {
            if (err) callFunc(err);
            else callFunc(null, result);
        });
    }

    /* получить информацию при переходе по постраничным ссылкам */
    function getInformationForChoicePage(callFunc) {
        if (typeof objResultFindTaskFilter[objReq.userId] === 'undefined' || Array.isArray(objResultFindTaskFilter[objReq.userId]) == false) {
            return callFunc(new Error('userId is not defined'));
        }

        var patternTaskIndex = new RegExp('^[0-9]+$');
        if (!patternTaskIndex.test(objReq.chunkNumber)) return callFunc(new Error('incorrect chunk number'));

        var nextChunkNumber = +objReq.chunkNumber;
        var newArray = objResultFindTaskFilter[objReq.userId][nextChunkNumber - 1];

        var objInformationTasks = {};
        async.map(newArray, function(id, callbackMap) {
            redis.hmget('task_filtering_all_information:' + id,
                'dateTimeAddTaskFilter',
                'sourceId',
                'userName',
                'jobStatus',
                'uploadFiles',
                'filterSettings',
                'countFilesFound',
                function(err, data) {
                    if (err) return callbackMap(err);

                    objInformationTasks[id] = {
                        dateTimeAddTaskFilter: data[0],
                        sourceId: data[1],
                        userName: data[2],
                        jobStatus: data[3],
                        uploadFiles: data[4],
                        filterSettings: data[5],
                        countFilesFound: data[6]
                    };

                    callbackMap(null, {
                        informationTaskIndex: objInformationTasks,
                        informationPaginate: {
                            maxCountElementsIndex: MAX_COUNT_TASK_INDEX,
                            chunksNumber: nextChunkNumber,
                            countChunks: newArray.length,
                            countElements: objResultFindTaskFilter[objReq.userId].countTasks
                        }
                    });
                });
        }, function(err, arrayResult) {
            if (err) callFunc(err);
            else callFunc(null, arrayResult[0]);
        });
    }
};