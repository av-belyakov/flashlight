/*
 * Формирование и отправка пакетов в формате JSON необходимых
 * для управления выгрузкой файлов с удаленных источников
 *
 * модули:
 * startRequestDownloadFiles - запрос на выгрузку файлов
 * stopRequestDownloadFiles - запрос на остановку выгрузке файлов
 *
 *
 * Версия 0.1, дата релиза 01.09.2016
 * */

'use strict';

const async = require('async');

const getUserId = require('./../users_management/getUserId');
const errorsType = require('../../errors/errorsType');
const objWebsocket = require('../../configure/objWebsocket');

/*
 Запрос на загрузку файлов
 формат запроса, JSON, со следующими параметрами:
  - messageType - тип запроса
  - processing - начало выгрузки файлов
  - taskIndex - уникальный идентификатор задачи,
  - countFilesFound - колличество найденнх файлов,
  - directoryFiltering - директория для результатов фильтрации

 изменяет следующие параметры в таблице task_filtering_all_information:
  - userNameStartUploadFiles,
  - dateTimeStartUploadFiles
*/
module.exports.startRequestDownloadFiles = function(redis, objData, socketIo, func) {
    let { sourceId, hashId } = objData;

    async.waterfall([
        //получаем логин пользователя
        function(callback) {
            getUserId.userId(redis, socketIo, (err, userId) => {
                if (err) {
                    callback(new errorsType.receivedIncorrectData('Ошибка: невозможно выгрузить файлы, получены некорректные данные'));
                } else {
                    redis.hmget('user_authntication:' + userId, 'login', 'user_name', (err, user) => {
                        if (err) callback(err);
                        else callback(null, user[0], user[1]);
                    });
                }
            });
        },
        //удаляем идентификатор задачи из таблицы task_turn_downloading_files
        function(userLogin, userName, callback) {
            redis.lrem('task_turn_downloading_files', 0, id, (err) => {
                if (err) callback(err);
                else callback(null, userLogin, userName);
            });
        },
        //записываем логин пользователя инициировавшего загрузку в таблицу task_filtering_all_information:
        function(userLogin, userName, callback) {
            redis.hmset('task_filtering_all_information:' + hashId, {
                'userLoginImport': userLogin,
                'userNameStartUploadFiles': userName,
                'dateTimeStartUploadFiles': +new Date(),
                'uploadFiles': 'expect'
            }, (err) => {
                if (err) callback(err);
                else callback(null);
            });
        },
        //получаем необходимую информацию для формирования запроса о начале загрузки файлов
        function(callback) {
            redis.hmget('task_filtering_all_information:' + hashId, 'countFilesFound', 'directoryFiltering', (err, result) => {
                if (err) callback(err);
                else callback(null, {
                    'messageType': 'download files',
                    'processing': 'start',
                    'taskIndex': `${sourceId}:${hashId}`,
                    'countFilesFound': result[0],
                    'directoryFiltering': result[1]
                });
            });
        }
    ], function(err, obj) {
        if (err) {
            if (err.name === 'Error') {
                return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
            } else {
                return func(err);
            }
        }

        let wsConnection = objWebsocket['remote_host:' + sourceId];
        if (typeof wsConnection === 'undefined') {
            func(new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${id} не существует`));
        } else {
            //изменяем статус загрузки файлов на 'ожидает'
            redis.hset('task_filtering_all_information:' + hashId, 'uploadFiles', 'expect', (err) => {
                if (err) {
                    func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                } else {
                    wsConnection.sendUTF(JSON.stringify(obj));
                    func(null);
                }
            });
        }
    });
};

/*
 Запрос на остановку загрузки
 формат запроса, JSON, со следующими параметрами:
  - messageType - тип запроса
  - processing - остановка выгрузки файлов
  - taskIndex - уникальный идентификатор задачи,
*/
module.exports.stopRequestDownloadFiles = function(sourceId, id, func) {
    let wsConnection = objWebsocket['remote_host:' + sourceId];

    if (typeof wsConnection === 'undefined') {
        func(new errorsType.taskIndexDoesNotExist('Задачи с идентификатором ' + id + ' не существует'));
    } else {
        wsConnection.sendUTF(JSON.stringify({
            'messageType': 'download files',
            'processing': 'stop',
            'taskIndex': id
        }));
        func(null, sourceId);
    }
};

/*
 Запрос на возобновление загрузки файлов
 формат запроса, JSON, со следующими параметрами:
 - messageType - тип запроса
 - processing - возобновление выгрузки файлов
 - taskIndex - уникальный идентификатор задачи,
 - countFilesFound - колличество найденнх файлов,
 - directoryFiltering - директория для результатов фильтрации
 - arrayNameReceivedFiles - массив имен уже переданных файлов

 изменяет следующие параметры в таблице task_filtering_all_information:
 - userNameStartUploadFiles,
 - dateTimeStartUploadFiles
*/
module.exports.resumeRequestDownloadFiles = function(redis, sourceId, taskIndex, arrayNameReceivedFiles, socketIo, func) {
    async.waterfall([
        function(callback) {
            getUserId.userId(redis, socketIo, (err, userId) => {
                if (err) callback(new errorsType.receivedIncorrectData('Ошибка: невозможно выгрузить файлы, получены некорректные данные'));
                else callback(null, userId);
            });
        },
        function(userId, callback) {
            redis.hget('user_authntication:' + userId, 'user_name', (err, userName) => {
                if (err) callback(err);
                else callback(null, userName);
            });
        },
        function(userName, callback) {
            redis.hmset('task_filtering_all_information:' + taskIndex, {
                'uploadFiles': 'expect',
                'userNameStartUploadFiles': userName,
                'dateTimeStartUploadFiles': +new Date(),
                'userNameStopUploadFiles': 'null',
                'dateTimeStopUploadFiles': 'null'
            }, (err) => {
                if (err) callback(err);
                else callback(null);
            });
        },
        function(callback) {
            redis.hmget('task_filtering_all_information:' + taskIndex, 'countFilesFound', 'directoryFiltering', (err, result) => {
                if (err) callback(err);
                else callback(null, {
                    'messageType': 'download files',
                    'processing': 'resume',
                    'taskIndex': sourceId + ':' + taskIndex,
                    'countFilesFound': result[0],
                    'directoryFiltering': result[1],
                    'arrayNameReceivedFiles': arrayNameReceivedFiles
                });
            });
        }
    ], function(err, obj) {
        if (err) {
            if (err.name === 'Error') {
                return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
            } else {
                return func(err);
            }
        }

        let wsConnection = objWebsocket['remote_host:' + sourceId];
        if (typeof wsConnection === 'undefined') {
            func(new errorsType.taskIndexDoesNotExist('Задачи с идентификатором ' + sourceId + ':' + taskIndex + ' не существует, или источник №<strong>' + sourceId + '</strong> не подключен'));
        } else {
            wsConnection.sendUTF(JSON.stringify(obj));
            func(null, sourceId);
        }
    });
};