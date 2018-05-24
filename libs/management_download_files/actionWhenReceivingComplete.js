/*
 * Выполняется при получении от источника сообщения
 * messageType: download_files
 * processing: complete
 *
 * При этом удаляется информация из следующих таблиц
 * - task_implementation_downloading_files
 *
 * В таблице task_filtering_all_information:* изменяются следующие поля:
 * - uploadFiles,
 * - dateTimeEndUploadFiles
 *
 * Проверяем количество загруженных файлов анализируя таблицу task_loading_files:*
 *
 * Добавляем в таблицу task_filtering_upload_not_considered хеш задачи по которой выгружали файлы
 *
 * Формируем в загружаемой директории файл в формате XML с информацией о параметрах фильтрации
 *
 * Версия 0.1, дата релиза 11.10.2016
 * */

'use strict';

const fs = require('fs');

const async = require('async');
const xml2js = require('xml2js');

module.exports = function(redis, taskIndex, func) {
    let [sourceId, taskIndexHash] = taskIndex.split(':');

    //проверяем количество загруженных файлов
    redis.hvals('task_loading_files:' + taskIndexHash, function(err, resultArray) {
        if (err) return func(err);

        let newResultArray = resultArray.filter(function(item) {
            if (~item.indexOf('/')) {
                let statusDownload = item.split('/')[2];
                return statusDownload === 'successfully';
            }
        });

        if (resultArray.length === newResultArray.length) {
            taskFullyCompleted(redis, sourceId, taskIndexHash, taskIndex, function(err) {
                if (err) func(err);
                else func(null, { 'receivedIsSuccess': true });
            });
        } else {
            taskNotFullCompleted(redis, taskIndexHash, taskIndex, function(err) {
                if (err) func(err);
                else func(null, { 'receivedIsSuccess': false });
            });
        }
    });
};

//когда не все файлы были загруженны
function taskNotFullCompleted(redis, taskIndexHash, taskIndex, feedBack) {
    async.parallel([
        //удаляем элемент из таблицы task_implementation_downloading_files
        function(callback) {
            redis.lrem('task_implementation_downloading_files', 0, taskIndex, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        },
        function(callback) {
            redis.hmset('task_filtering_all_information:' + taskIndexHash, {
                'uploadFiles': 'suspended',
                'dateTimeStopUploadFiles': +new Date()
            }, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        }
    ], function(err) {
        if (err) feedBack(err);
        else feedBack(null);
    });
}

//выполняется когда все файлы были загруженны
function taskFullyCompleted(redis, sourceId, taskIndexHash, taskIndex, feedBack) {
    async.parallel([
        //удаляем элемент из таблицы task_implementation_downloading_files
        function(callback) {
            redis.lrem('task_implementation_downloading_files', 0, taskIndex, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        },
        function(callback) {
            redis.hmset('task_filtering_all_information:' + taskIndexHash, {
                'uploadFiles': 'uploaded',
                'dateTimeEndUploadFiles': +new Date()
            }, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        },
        //добавляем в таблицу task_filtering_upload_not_considered хеш задачи
        function(callback) {
            redis.zadd('task_filtering_upload_not_considered', +new Date(), taskIndex, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        },
        //создаем файл в формате XML
        function(callback) {
            createFileXml(redis, sourceId, taskIndexHash, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        }
    ], function(err) {
        if (err) feedBack(err);
        else feedBack(null);
    });
}

//формируем XML файл
function createFileXml(redis, sourceId, taskIndexHash, func) {
    async.waterfall([
        //получаем данные из таблицы remote_host:settings:*
        function(callback) {
            redis.hmget('remote_host:settings:' + sourceId,
                'shortName',
                'detailedDescription',
                'ipaddress',
                'port',
                function(err, arrData) {
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
            redis.hmget('task_filtering_all_information:' + taskIndexHash,
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

                    callback(null, objRemoteHostSettings, uploadDirectoryFiles)
                });
        },
        //формируем XML файл
        function(objRemoteHostSettings, uploadDirectoryFiles, callback) {
            let builder = new xml2js.Builder();
            let xml = builder.buildObject(objRemoteHostSettings);

            fs.appendFile(uploadDirectoryFiles + '/file_description_' + +new Date() + '.xml', xml, { 'encoding': 'utf8' }, function(err) {
                if (err) callback(err);
                else callback(null, true);
            });
        }
    ], function(err) {
        if (err) func(err);
        else func(null);
    });
}