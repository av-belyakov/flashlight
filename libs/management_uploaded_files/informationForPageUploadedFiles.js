/*
 * Поиск информации по загруженным файлам
 *
 * Версия 0.1, дата релиза 07.12.2016
 * */

'use strict';

const async = require('async');

const errorsType = require('../../errors/errorsType');
const writeLogFile = require('../writeLogFile');
const objDownloadFilesTmp = require('../../configure/objDownloadFilesTmp');
const searchEnginesUploadedFiles = require('../search_engines/searchEnginesUploadedFiles');

/*
 * objReq.userId,
 * objReq.objSearchInformation,
 * objReq.isNewReq,
 * objReq.chunkNumber
 * */

/**
 * получаем информацию по недавно загруженным но не рассмотренным файлам
 * 
 * @param {*} redis 
 * @param {*} objReq 
 * @param {*} func 
 */
module.exports.getNewInformationFileUpload = function(redis, objReq, func) {
    redis.zrange('task_filtering_upload_not_considered', [0, -1], function(err, listTaskUpload) {
        if (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            return func({});
        }
        let objInformationTasks = {};

        async.map(listTaskUpload, function(id, callbackMap) {
            try {
                let [sourceId, taskId] = id.split(':');
                redis.hget('remote_host:settings:' + sourceId,
                    'shortName',
                    function(err, shortName) {
                        if (err) return callbackMap(err);

                        redis.hmget('task_filtering_all_information:' + taskId,
                            'dateTimeStartUploadFiles',
                            'sourceId',
                            'countFilesLoaded',
                            'countFoundFilesSize',
                            'userNameStartUploadFiles',
                            'filterSettings',
                            function(err, data) {
                                if (err) return callbackMap(err);

                                objInformationTasks[taskId] = {
                                    dateTimeStartUploadFiles: data[0],
                                    sourceId: data[1],
                                    shortName: shortName,
                                    countFilesLoaded: data[2],
                                    countFoundFilesSize: data[3],
                                    userNameStartUploadFiles: data[4],
                                    filterSettings: data[5]
                                };

                                callbackMap(null, objInformationTasks);
                            });
                    });
            } catch (err) {
                return callbackMap(err);
            }
        }, function(err, arrayResult) {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                func({});
            } else {
                func(arrayResult[0]);
            }
        });
    });
};

/**
 * поиск или вывод информации по запросу пагинатора
 * 
 * @param {*} redis 
 * @param {*} objReq 
 * @param {*} func 
 */
module.exports.getAllInformationSearching = function(redis, objReq, func) {
    const MAX_COUNT_TASK_INDEX = 14;

    if (objReq.isNewReq === true) {
        //получить информацию для первой страницы или при поиске
        getStartInformationUploadFiles(function(err, result) {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                func(err);
            } else {
                func(null, result);
            }
        });
    }
    if (objReq.isNewReq === false) {
        //получить информацию при переходе по постраничным ссылкам
        getInformationUploadFilesChoicePage(function(err, result) {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                func(err);
            } else {
                func(null, result);
            }
        });
    }

    /* получить информацию для первой страницы или при поиске */
    function getStartInformationUploadFiles(callbackFunc) {
        searchEnginesUploadedFiles.search(redis, objReq, function(err, arrayResult) {
            if (err) return callbackFunc(err);

            let arrayTasksLength = arrayResult.length;

            let countChunks = Math.ceil(arrayTasksLength / MAX_COUNT_TASK_INDEX);
            var newArray = [];
            for (let num = 0; num < countChunks; num++) {
                newArray[num] = arrayResult.splice(0, MAX_COUNT_TASK_INDEX);
            }

            objDownloadFilesTmp.objResultFindTaskUpload = {};
            objDownloadFilesTmp.objResultFindTaskUpload[objReq.userId] = newArray;
            objDownloadFilesTmp.objResultFindTaskUpload[objReq.userId].countTasks = arrayTasksLength;

            //получаем информацию по первой части
            var objInformationTasks = {};
            async.map(objDownloadFilesTmp.objResultFindTaskUpload[objReq.userId][0], function(id, callbackMap) {
                redis.hmget('task_filtering_all_information:' + id,
                    'dateTimeStartUploadFiles',
                    'sourceId',
                    'countFilesLoaded',
                    'countFoundFilesSize',
                    'userNameStartUploadFiles',
                    'filterSettings',
                    function(err, data) {
                        if (err) return callbackMap(err);

                        redis.hget('remote_host:settings:' + data[1],
                            'shortName',
                            function(err, shortName) {
                                if (err) return callbackMap(err);

                                objInformationTasks[id] = {
                                    dateTimeStartUploadFiles: data[0],
                                    sourceId: data[1],
                                    shortName: shortName,
                                    countFilesLoaded: data[2],
                                    countFoundFilesSize: data[3],
                                    userNameStartUploadFiles: data[4],
                                    filterSettings: data[5]
                                };

                                callbackMap(null, {
                                    informationTaskIndex: objInformationTasks,
                                    informationPaginate: {
                                        maxCountElementsIndex: MAX_COUNT_TASK_INDEX,
                                        chunksNumber: 1,
                                        countChunks: countChunks,
                                        countElements: objDownloadFilesTmp.objResultFindTaskUpload[objReq.userId].countTasks
                                    }
                                });
                            });
                    });
            }, function(err, arrayResult) {
                if (err) callbackFunc(err);
                else callbackFunc(null, arrayResult[0]);
            });
        });

    }

    // получить информацию при переходе по постраничным ссылкам 
    function getInformationUploadFilesChoicePage(callbackFunc) {
        if ((typeof objDownloadFilesTmp.objResultFindTaskUpload[objReq.userId] === 'undefined') || (!Array.isArray(objDownloadFilesTmp.objResultFindTaskUpload[objReq.userId]))) {
            writeLogFile.writeLog('\tError: userId is not defined');
            return callbackFunc(new errorsType.receivedIncorrectData('Ошибка: поиск невозможен, неверный идентификатор пользователя'));
        }

        let patternTaskIndex = new RegExp('^[0-9]+$');
        if (!patternTaskIndex.test(objReq.chunkNumber)) {
            writeLogFile.writeLog('\tError: incorrect page number');
            return callbackFunc(new errorsType.receivedIncorrectData('Ошибка: поиск невозможен, некорректный номер страницы'));
        }

        let nextChunkNumber = +objReq.chunkNumber;
        let newArray = objDownloadFilesTmp.objResultFindTaskUpload[objReq.userId][nextChunkNumber - 1];

        let objInformationTasks = {};
        async.map(newArray, function(id, callbackMap) {
            redis.hmget(
                'task_filtering_all_information:' + id,
                'dateTimeStartUploadFiles',
                'sourceId',
                'countFilesLoaded',
                'countFoundFilesSize',
                'userNameStartUploadFiles',
                'filterSettings',
                function(err, data) {
                    if (err) return callbackMap(err);

                    redis.hget(
                        'remote_host:settings:' + data[1],
                        'shortName',
                        function(err, shortName) {
                            if (err) return callbackMap(err);

                            objInformationTasks[id] = {
                                dateTimeStartUploadFiles: data[0],
                                sourceId: data[1],
                                shortName: shortName,
                                countFilesLoaded: data[2],
                                countFoundFilesSize: data[3],
                                userNameStartUploadFiles: data[4],
                                filterSettings: data[5]
                            };

                            callbackMap(null, {
                                informationTaskIndex: objInformationTasks,
                                informationPaginate: {
                                    maxCountElementsIndex: MAX_COUNT_TASK_INDEX,
                                    chunksNumber: nextChunkNumber,
                                    countChunks: objDownloadFilesTmp.objResultFindTaskUpload[objReq.userId].length,
                                    countElements: objDownloadFilesTmp.objResultFindTaskUpload[objReq.userId].countTasks
                                }
                            });
                        });
                });
        }, function(err, arrayResult) {
            if (err) callbackFunc(err);
            else callbackFunc(null, arrayResult[0]);
        });
    }

};