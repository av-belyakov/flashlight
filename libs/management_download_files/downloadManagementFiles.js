/*
 * Формирование и отправка пакетов в формате JSON, необходимых
 * для управления выгрузкой файлов с удаленных источников
 *
 * модули:
 * startRequestDownloadFiles - запрос на выгрузку файлов
 * stopRequestDownloadFiles - запрос на останов процесса выгрузки файлов
 *
 *
 * Версия 0.1, дата релиза 10.07.2018
 * */

'use strict';

const debug = require('debug')('downloadManagemetFiles');

const async = require('async');

const getUserId = require('./../users_management/getUserId');
const errorsType = require('../../errors/errorsType');
const globalObject = require('../../configure/globalObject');
const objWebsocket = require('../../configure/objWebsocket');

/**
 * @param {*} redis - дискриптор соединения с БД
 * @param {*} objData - содержит следующие параметры: sourceId, taskIndex и listFiles
 * @param {*} socketIo - дискриптор соединения по протоколу sockeio
 */
module.exports.startRequestDownloadFiles = function(redis, socketIo, objData) {
    let { sourceID, taskIndex, listFiles } = objData;
    let countDownloadSelectedFiles = listFiles.length;

    return new Promise((resolve, reject) => {
        //удаляем идентификатор задачи из таблицы task_turn_downloading_files и добавляем в таблицу task_implementation_downloading_files
        changeTaskInListDownloadFiles(redis, {
            sourceId: sourceID,
            taskIndex: taskIndex
        }, 'start', (err) => {
            if (err) reject(err);
            else resolve();
        });
    }).then(() => {
        //получаем имя и логин пользователя
        return new Promise((resolve, reject) => {
            getUserId.userId(redis, socketIo, (err, userId) => {
                if (err) reject(err);
                else resolve(userId);
            });
        }).then(userID => {
            return new Promise((resolve, reject) => {
                redis.hmget(`user_authntication:${userID}`, 'login', 'user_name', (err, user) => {
                    if (err) reject(err);
                    else resolve({
                        userLogin: user[0],
                        userName: user[1]
                    });
                });
            }).catch((err) => {
                throw (err);
            });
        });
    }).then(objResult => {
        let { userLogin, userName } = objResult;

        //записываем логин пользователя инициировавшего загрузку в таблицу task_filtering_all_information:
        return new Promise((resolve, reject) => {
            redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                'userLoginImport': userLogin,
                'userNameStartUploadFiles': userName,
                'dateTimeStartUploadFiles': +new Date(),
                'uploadFiles': 'expect'
            }, (err) => {
                if (err) reject(err);
                else resolve();
            });
        }).catch((err) => {
            throw (err);
        });
    }).then(() => {
        //добавляем информацию о задаче в глобальный объект
        globalObject.setData('processingTasks', taskIndex, {
            'taskType': 'upload',
            'sourceId': sourceID,
            'status': 'expect',
            'timestampStart': +new Date(),
            'timestampModify': +new Date()
        });
    }).then(() => {
        //получаем директорию в которую сохранялись отфильтрованные файлы
        return new Promise((resolve, reject) => {
            redis.hget(`task_filtering_all_information:${taskIndex}`, 'directoryFiltering', (err, directoryFiltering) => {
                if (err) reject(err);
                else resolve(directoryFiltering);
            });
        }).catch((err) => {
            throw (err);
        });
    }).then(directoryFiltering => {
        let wsConnection = objWebsocket[`remote_host:${sourceID}`];

        if (typeof wsConnection === 'undefined') {
            throw (new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${taskIndex} не существует`));
        }

        //изменяем статус загрузки файлов на 'ожидает'
        redis.hset(`task_filtering_all_information:${taskIndex}`, 'uploadFiles', 'expect', (err) => {
            if (err) {
                throw (new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
            }
        });

        //формируем и отправляем запрос на скачивание файлов
        if (listFiles.length === 0) {
            //если выбранны ВСЕ файлы
            let strRequest = JSON.stringify({
                'messageType': 'download files',
                'info': {
                    'processing': 'start',
                    'taskIndex': taskIndex,
                    'downloadDirectoryFiles': directoryFiltering,
                    'downloadSelectedFiles': false,
                    'countDownloadSelectedFiles': 0,
                    'numberMessageParts': [0, 0],
                    'listDownloadSelectedFiles': []
                }
            });

            debug('CHOOSE ALL FILES');
            debug(strRequest);

            return wsConnection.sendUTF(strRequest);
        }

        /** ДЛЯ ТЕСТА ВЫБРАННО ТОЛЬКО 3 файла в сообщении, УВЕЛИЧИТЬ ДО 30 */

        //если скачиваются ТОЛЬКО выбранные пользователем файлы
        let { countChunk, list: newListFiles } = transformListIndexFiles(20, listFiles);

        debug(`count chunks = ${countChunk}`);
        debug(newListFiles);
        debug(`countDownloadSelectedFiles ${listFiles.length}`);

        //предварительный запрос
        let objRequest = {
            'messageType': 'download files',
            'info': {
                'processing': 'start',
                'taskIndex': taskIndex,
                'downloadDirectoryFiles': directoryFiltering,
                'downloadSelectedFiles': true,
                'countDownloadSelectedFiles': countDownloadSelectedFiles,
                'numberMessageParts': [0, countChunk],
                'listDownloadSelectedFiles': []
            }
        };

        debug('CHOOSE FILES');
        debug(objRequest);

        wsConnection.sendUTF(JSON.stringify(objRequest));

        for (let i = 0; i < countChunk; i++) {
            objRequest.info.numberMessageParts = [(i + 1), countChunk];
            objRequest.info.listDownloadSelectedFiles = newListFiles[i];

            debug('------');
            debug(objRequest);

            wsConnection.sendUTF(JSON.stringify(objRequest));
        }
    }).catch(err => {
        throw (err);
    });
};

/*
 Запрос на остановку загрузки
 формат запроса, JSON, со следующими параметрами:
  - messageType - тип запроса
  - processing - остановка выгрузки файлов
  - taskIndex - уникальный идентификатор задачи,
*/
module.exports.stopRequestDownloadFiles = function(sourceID, id, func) {
    let wsConnection = objWebsocket['remote_host:' + sourceID];

    if (typeof wsConnection === 'undefined') {
        func(new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${id} не существует`));
    } else {
        wsConnection.sendUTF(JSON.stringify({
            'messageType': 'download files',
            'processing': 'stop',
            'taskIndex': id
        }));
        func(null, sourceID);
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

 
*/
module.exports.resumeRequestDownloadFiles = function(redis, sourceID, taskIndex, arrayNameReceivedFiles, socketIo, cb) {
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
            redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                'uploadFiles': 'expect',
                'userNameStartUploadFiles': userName,
                'dateTimeStartUploadFiles': +new Date(),
                'userNameStopUploadFiles': 'null',
                'dateTimeStopUploadFiles': 'null'
            }, err => {
                if (err) callback(err);
                else callback(null);
            });
        },
        function(callback) {
            redis.hmget(`task_filtering_all_information:${taskIndex}`, 'countFilesFound', 'directoryFiltering', (err, result) => {
                if (err) callback(err);
                else callback(null, {
                    'messageType': 'download files',
                    'processing': 'resume',
                    'taskIndex': sourceID + ':' + taskIndex,
                    'countFilesFound': result[0],
                    'directoryFiltering': result[1],
                    'arrayNameReceivedFiles': arrayNameReceivedFiles
                });
            });
        }
    ], function(err, obj) {
        if (err) {
            if (err.name !== 'Error') return cb(err);
            return cb(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
        }

        let wsConnection = objWebsocket['remote_host:' + sourceID];
        if (typeof wsConnection === 'undefined') {
            return cb(new errorsType.taskIndexDoesNotExist('Задачи с идентификатором ' + sourceId + ':' + taskIndex + ' не существует, или источник №<strong>' + sourceId + '</strong> не подключен'));
        }

        wsConnection.sendUTF(JSON.stringify(obj));
        cb(null, sourceID);
    });
};

//делим список файлов на фрагменты и считаем их количество
function transformListIndexFiles(sizeChunk, listFiles) {
    let newListFiles = [];

    if (listFiles.length === 0) return { countChunk: 0, list: [] };
    if (listFiles.length < sizeChunk) return { countChunk: 1, list: listFiles };

    let countChunk = Math.floor(listFiles.length / sizeChunk);
    let y = listFiles.length / sizeChunk;

    if ((y - countChunk) !== 0) countChunk++;


    for (let i = 0; i < countChunk; i++) {
        newListFiles.push(listFiles.splice(0, sizeChunk));
    }

    return { countChunk: countChunk, list: newListFiles };
}

function changeTaskInListDownloadFiles(redis, obj, typeChange, cb) {
    let hashId = `${obj.sourceId}:${obj.taskIndex}`;

    if (typeChange === 'start') {
        //удаляем идентификатор задачи из таблицы task_turn_downloading_files и добавляем в таблицу task_implementation_downloading_files
        async.parallel([
            callback => {
                redis.lrem('task_turn_downloading_files', 0, hashId, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            callback => {
                redis.lpush('task_implementation_downloading_files', hashId, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            }
        ], err => {
            if (err) cb(err);
            else cb(null);
        });
    } else {
        //удаляем идентификатор задачи из таблицы task_implementation_downloading_files и добавляем в task_turn_downloading_files
        async.parallel([
            callback => {
                redis.lrem('task_implementation_downloading_files', 0, hashId, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            callback => {
                redis.lpush('task_turn_downloading_files', hashId, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            }
        ], err => {
            if (err) cb(err);
            else cb(null);
        });
    }
}