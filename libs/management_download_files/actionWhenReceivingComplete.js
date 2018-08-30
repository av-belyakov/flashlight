/*
 * Модуль выполняет обработку информации при получении от источника сообщения о завершении передачи файлов
 *
 * Версия 0.11, дата релиза 22.08.2018
 * */

'use strict';

const fs = require('fs');
const async = require('async');
const xml2js = require('xml2js');

/**
 * проверка количества загруженных файлов
 * 
 * @param {*} redis - дескриптор соединеия с БД
 * @param {*} param1 { taskIndex - ID задачи, sourceID - ID источника }
 * @param {*} cb - функция обратного вызова
 */
module.exports = function(redis, { taskIndex, sourceID }, cb) {
    return new Promise((resolve, reject) => {
        redis.hvals(`task_list_files_found_during_filtering:${sourceID}:${taskIndex}`, (err, listValueFiles) => {
            if (err) reject(err);
            else resolve(listValueFiles);
        });
    }).then(listValueFiles => {
        let fileIsDownloaded = listValueFiles.filter(item => {
            try {
                let tmpObj = JSON.parse(item);

                if (typeof tmpObj.fileDownloaded === 'undefined') return false;

                return tmpObj.fileDownloaded;
            } catch (err) {
                return false;
            }
        });

        return {
            countFilesAll: listValueFiles.length,
            countFilesDownloaded: fileIsDownloaded.length
        };
    }).then(({ countFilesAll, countFilesDownloaded }) => {
        return new Promise((resolve, reject) => {
            if (countFilesAll === countFilesDownloaded) {
                taskFullyCompleted(redis, taskIndex, sourceID, err => {
                    if (err) reject(err);
                    else resolve();
                });
            } else {
                taskNotFullCompleted(redis, taskIndex, sourceID, err => {
                    if (err) reject(err);
                    else resolve();
                });
            }
        });
    }).catch(err => {
        throw (err);
    });
};

//когда не все файлы были загруженны
function taskNotFullCompleted(redis, taskIndex, sourceID, feedBack) {
    async.parallel([
        callback => {
            redis.lrem('task_implementation_downloading_files', 0, `${sourceID}:${taskIndex}`, err => {
                if (err) callback(err);
                else callback(null);
            });
        },
        callback => {
            redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                'uploadFiles': 'partially loaded',
                'dateTimeEndUploadFiles': +new Date()
            }, err => {
                if (err) callback(err);
                else callback(null);
            });
        }
    ], err => {
        if (err) feedBack(err);
        else feedBack(null);
    });
}

//выполняется когда все файлы были загруженны
function taskFullyCompleted(redis, taskIndex, sourceID, feedBack) {
    async.parallel([
        //удаляем элемент из таблицы task_implementation_downloading_files
        function(callback) {
            redis.lrem('task_implementation_downloading_files', 0, `${sourceID}:${taskIndex}`, err => {
                if (err) callback(err);
                else callback(null);
            });
        },
        function(callback) {
            redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                'uploadFiles': 'uploaded',
                'dateTimeEndUploadFiles': +new Date()
            }, err => {
                if (err) callback(err);
                else callback(null);
            });
        },
        //добавляем в таблицу task_filtering_upload_not_considered хеш задачи
        function(callback) {
            redis.zadd('task_filtering_upload_not_considered', +new Date(), `${sourceID}:${taskIndex}`, err => {
                if (err) callback(err);
                else callback(null);
            });
        },
        //создаем файл в формате XML
        function(callback) {
            createFileXml(redis, taskIndex, sourceID, err => {
                if (err) callback(err);
                else callback(null);
            });
        }
    ], function(err) {
        if (err) feedBack(err);
        else feedBack(null);
    });
}

//формируем XML файл
function createFileXml(redis, taskIndex, sourceID, func) {
    async.waterfall([
        //получаем данные из таблицы remote_host:settings:*
        function(callback) {
            redis.hmget(`remote_host:settings:${sourceID}`,
                'shortName',
                'detailedDescription',
                'ipaddress',
                'port',
                (err, arrData) => {
                    if (err) callback(err);
                    else callback(null, {
                        'shortName': arrData[0],
                        'detailedDescription': arrData[1],
                        'ipaddress': arrData[2],
                        'port': arrData[3]
                    });
                });
        },
        //получаем данные из таблицы task_filtering_all_information:*
        function(objRemoteHostSettings, callback) {
            redis.hmget(`task_filtering_all_information:${taskIndex}`,
                'sourceId',
                'userLogin',
                'userName',
                'dateTimeStartFilter',
                'dateTimeEndFilter',
                'filterSettings',
                'userNameLookedThisTask',
                'dateTimeLookedThisTask',
                'countFilesLoaded',
                'userNameStartUploadFiles',
                'uploadFiles',
                'countFilesProcessed',
                'countMaxFilesSize',
                'uploadDirectoryFiles',
                'countFoundFilesSize',
                'jobStatus',
                'dateTimeStopUploadFiles',
                'countFilesChunk',
                'directoryFiltering',
                'userNameStopUploadFiles',
                'countDirectoryFiltering',
                'dateTimeStartUploadFiles',
                'dateTimeAddTaskFilter',
                'countFilesLoadedError',
                'userNameContinueUploadFiles',
                'countFilesFiltering',
                'countFullCycle',
                'dateTimeContinueUploadFiles',
                'countCycleComplete',
                'countFilesFound',
                'dateTimeEndUploadFiles',
                function(err, arrData) {
                    if (err) return callback(err);

                    objRemoteHostSettings.sourceId = arrData[0];
                    objRemoteHostSettings.userLogin = arrData[1];
                    objRemoteHostSettings.userName = arrData[2];
                    objRemoteHostSettings.dateTimeStartFilter = arrData[3];
                    objRemoteHostSettings.dateTimeEndFilter = arrData[4];
                    objRemoteHostSettings.filterSettings = JSON.parse(arrData[5]);
                    objRemoteHostSettings.userNameLookedThisTask = arrData[6];
                    objRemoteHostSettings.dateTimeLookedThisTask = arrData[7];
                    objRemoteHostSettings.countFilesLoaded = arrData[8];
                    objRemoteHostSettings.userNameStartUploadFiles = arrData[9];
                    objRemoteHostSettings.uploadFiles = arrData[10];
                    objRemoteHostSettings.countFilesProcessed = arrData[11];
                    objRemoteHostSettings.countMaxFilesSize = arrData[12];
                    objRemoteHostSettings.uploadDirectoryFiles = arrData[13];
                    objRemoteHostSettings.countFoundFilesSize = arrData[14];
                    objRemoteHostSettings.jobStatus = arrData[15];
                    objRemoteHostSettings.dateTimeStopUploadFiles = arrData[16];
                    objRemoteHostSettings.countFilesChunk = arrData[17];
                    objRemoteHostSettings.directoryFiltering = arrData[18];
                    objRemoteHostSettings.userNameStopUploadFiles = arrData[19];
                    objRemoteHostSettings.countDirectoryFiltering = arrData[20];
                    objRemoteHostSettings.dateTimeStartUploadFiles = arrData[21];
                    objRemoteHostSettings.dateTimeAddTaskFilter = arrData[22];
                    objRemoteHostSettings.countFilesLoadedError = arrData[23];
                    objRemoteHostSettings.userNameContinueUploadFiles = arrData[24];
                    objRemoteHostSettings.countFilesFiltering = arrData[25];
                    objRemoteHostSettings.countFullCycle = arrData[26];
                    objRemoteHostSettings.dateTimeContinueUploadFiles = arrData[27];
                    objRemoteHostSettings.countCycleComplete = arrData[28];
                    objRemoteHostSettings.countFilesFound = arrData[29];
                    objRemoteHostSettings.dateTimeEndUploadFiles = arrData[30];

                    let uploadDirectoryFiles = arrData[13];

                    callback(null, objRemoteHostSettings, uploadDirectoryFiles);
                });
        },
        //формируем XML файл
        function(objRemoteHostSettings, uploadDirectoryFiles, callback) {
            let builder = new xml2js.Builder();
            let xml = builder.buildObject(objRemoteHostSettings);

            fs.appendFile(`${uploadDirectoryFiles}/file_description_${+new Date()}.xml`, xml, { 'encoding': 'utf8' }, (err) => {
                if (err) callback(err);
                else callback(null, true);
            });
        }
    ], function(err) {
        if (err) func(err);
        else func(null);
    });
}