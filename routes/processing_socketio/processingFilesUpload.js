/*
 * Модуль выполняющий обработку заданий по загрузке файлов
 *
 * Версия 0.4, дата релиза 10.07.2018
 * */

'use strict';

const async = require('async');
const EventEmitter = require('events').EventEmitter;

const debug = require('debug')('processingFilesUpload.js');

const getUserId = require('../../libs/users_management/getUserId');
const errorsType = require('../../errors/errorsType');
const controllers = require('../../controllers');
const globalObject = require('../../configure/globalObject');
const writeLogFile = require('../../libs/writeLogFile');
const downloadManagementFiles = require('../../libs/management_download_files/downloadManagementFiles');
const checkSoursIdTableTaskImplementationDownloadingFiles = require('../../libs/checkSoursIdTableTaskImplementationDownloadingFiles');

let redis = controllers.connectRedis();

/**
 * Инициализация загрузки файлов (start)
 * 
 * @param data - содержит следующие параметры: taskIndex, sourceId, listFiles
 * @param socketIo - дискриптор соединения по протоколу socketio
 * @param cb - функция обратного вызова
 */
module.exports.start = function(socketIo, data, cb) {
    let taskIndex = data.taskIndex;

    async.waterfall([
        //получаем идентификатор сенсора
        callback => {

            debug('        //получаем идентификатор сенсора');

            redis.hget(`task_filtering_all_information:${taskIndex}`, 'sourceId', (err, sourceID) => {
                if (err) callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                else callback(null, sourceID);
            });
        },
        //проверяем есть ли соединение с источником
        (sourceID, callback) => {

            debug('        //проверяем есть ли соединение с источником');

            let connectionStatus = globalObject.getData('sources', sourceID, 'connectionStatus');

            if (connectionStatus === null || connectionStatus === 'disconnect') {
                callback(new errorsType.sourceIsNotConnection(`Ошибка: источник №<strong>${sourceID}</strong> не подключен`));
            } else {
                callback(null, sourceID);
            }
        },
        //проверяем есть ли в очереди на загрузку задача с соответствующим идентификатором
        (sourceID, callback) => {

            debug('        //проверяем есть ли в очереди на загрузку задача с соответствующим идентификатором');

            redis.lrange('task_turn_downloading_files', [0, -1], (err, list) => {
                if (err) return callback(err);

                let isTrue = list.some((item) => ((`${sourceID}:${taskIndex}`) === item));

                debug('task ID is exist ' + isTrue);

                if (isTrue) callback(new errorsType.taskIndexAlreadyExistToTurn(`Задача на экспорт сетевого трафика с идентификатором ${taskIndex} уже добавлена в очередь`));
                else callback(null, sourceID);
            });
        },
        //добавление задачи в очередь (загрузка данных в таблицу task_turn_downloading_files)
        (sourceID, callback) => {

            debug('        //добавление задачи в очередь (загрузка данных в таблицу task_turn_downloading_files)');

            redis.rpush('task_turn_downloading_files', `${sourceID}:${taskIndex}`, (err) => {
                if (err) callback(err);
                else callback(null, sourceID);
            });
        },
        //проверка осуществления загрузки файлов с указанного источника (идентификатор источника в таблице task_implementation_downloading_files)
        (sourceID, callback) => {

            debug('        //проверка осуществления загрузки файлов с указанного источника (идентификатор источника в таблице task_implementation_downloading_files)');

            redis.exists('task_implementation_downloading_files', (err, result) => {
                if (err) return callback(err);

                //если таблица task_implementation_downloading_files не существует
                if (result === 0) return callback(null, sourceID, false);

                //проверяем существует ли идентификатор в таблице task_implementation_downloading_files
                checkSoursIdTableTaskImplementationDownloadingFiles(redis, sourceID, function(err, taskIsPerformed) {
                    if (err) callback(new errorsType.undefinedServerError('Внутренняя ошибка сервера', err.toString()));
                    else callback(null, sourceID, taskIsPerformed);
                });
            });
        }
    ], (err, sourceID, taskIsPerformed) => {
        if (err) return cb(err);

        if (taskIsPerformed) {
            //добавляем задачу на скачивание в очередь
            downloadManagementFiles.addRequestDownloadFiles(redis, socketIo, {
                sourceID: sourceID,
                taskIndex: taskIndex,
                listFiles: data.listFiles
            }).then(() => {
                cb(null, sourceID);
            }).catch(err => {
                cb(err);
            });
        } else {
            //формируем и отправляем выбранному источнику запрос на выгрузку файлов в формате JSON
            downloadManagementFiles.startRequestDownloadFiles(redis, socketIo, {
                sourceID: sourceID,
                taskIndex: taskIndex,
                listFiles: data.listFiles
            }).then(() => {
                //создаем псевдоиндекс, таблица task_uploaded_index_all
                redis.zadd('task_uploaded_index_all', [+new Date(), taskIndex], (err) => {
                    if (err) writeLogFile.writeLog('\tError: ' + err.toString());
                });

                cb(null, sourceID);
            }).catch(err => {
                cb(err);
            });
        }
    });
};

/**
 * Отмена задач находящихся в очереди (cancel)
 * 
 * @param socketIo - дискриптор соединения по протоколу socketio
 * @param taskIndex - идентификатор задачи
 * @param func - функция обратного вызова
 */
module.exports.cancel = function(socketIo, taskIndex, func) {
    redis.exists('task_turn_downloading_files', (err, result) => {
        if (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
        }

        if (result === 0) {
            //если таблицы нет
            writeLogFile.writeLog(`\tError: Задачи с идентификатором ${taskIndex} не существует`);
            return func(new errorsType.sourceIsExist('Задачи с указанным идентификатором не существует'));
        }
        redis.hmget(`task_filtering_all_information:${taskIndex}`, 'sourceId', 'userLoginImport', (err, result) => {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
            }
            let [sourceId, userLoginImport] = result;

            getUserId.userId(redis, socketIo, (err, userId) => {
                if (err) {
                    writeLogFile.writeLog('\tError: Невозможно выгрузить файлы, получены некорректные данные');
                    return func(new errorsType.receivedIncorrectData('Ошибка: невозможно выгрузить файлы, получены некорректные данные'));
                }

                redis.hmget(`user_authntication:${userId}`, 'login', 'user_name', (err, user) => {
                    if (err) {
                        writeLogFile.writeLog(`\tError: ${err.toString()}`);
                        return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                    }

                    //проверяем соответствие пользователя инициировавшего импорт
                    if (user[0] !== userLoginImport) return func(new errorsType.errorAuthenticationUser('Ошибка: текущий пользователь не может отменить эту задачу задачу'));

                    async.parallel([
                        //удаляем идентификатор задачи из таблицы task_turn_downloading_files
                        callback => {
                            redis.lrem('task_turn_downloading_files', 0, `${sourceId}:${taskIndex}`, err => {
                                if (err) callback(err);
                                else callback(null, true);
                            });
                        },
                        //изменяем параметры в таблице task_filtering_all_information:*
                        callback => {
                            redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                                'userNameStartUploadFiles': 'null',
                                'dateTimeStartUploadFiles': 'null',
                                'uploadFiles': 'not loaded'
                            }, err => {
                                if (err) callback(err);
                                else callback(null, true);
                            });
                        },
                        //удаляем псевдоиндекс, таблица task_uploaded_index_all
                        callback => {
                            redis.zrem('task_uploaded_index_all', taskIndex, err => {
                                if (err) callback(err);
                                else callback(null, true);
                            });
                        }
                    ], err => {
                        if (err) {
                            writeLogFile.writeLog(`\tError: ${err.toString()}`);
                            func(err);
                        } else {
                            func(null, sourceId);
                        }
                    });
                });
            });
        });
    });
};

/**
 * Останов выполнения задачи (stop)
 * 
 * @param socketIo - дискриптор соединения по протоколу socketio
 * @param taskIndex - идентификатор задачи
 * @param func - функция обратного вызова
 */
module.exports.stop = function(socketIo, taskIndex, func) {
    async.waterfall([
        //проверяем выполняется ли загрузка с выбранного источника
        (callback) => {
            redis.exists('task_implementation_downloading_files', (err, result) => {
                if (err) return callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));

                //если таблица task_implementation_downloading_files не существует
                if (result === 0) {
                    callback(new errorsType.taskIndexDoesNotExist('Задачи с указанным идентификатором не существует'));
                } else {
                    callback(null);
                }
            });
        },
        (callback) => {
            redis.hmget(`task_filtering_all_information:${taskIndex}`, 'sourceId', 'userLoginImport', (err, result) => {
                if (err) callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                else callback(null, result[0], result[1]);
            });
        },
        (sourceId, userLoginImport, callback) => {
            redis.lrange('task_implementation_downloading_files', [0, -1], (err, list) => {
                if (err) return callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));

                let id = `${sourceId}:${taskIndex}`;
                let isTrue = list.some((item) => id === item);

                if (!isTrue) callback(new errorsType.taskIndexDoesNotExist(`Задачи с идентификатором ${id} не существует`));
                else callback(null, sourceId, userLoginImport, id);
            });
        }
    ], (err, sourceId, userLoginImport, id) => {
        if (err) {
            if (err.name === 'errorRedisDataBase') writeLogFile.writeLog(`\tError: ${err.cause}`);
            else writeLogFile.writeLog('\tError: ' + err.message);

            return func(err);
        }

        //------------------
        redis.lrange('task_implementation_downloading_files', [0, -1], (err, result) => {
            if (err) return debug(err);
            debug('********* STOP **********');
            debug(' +++ downloadfiles +++ ');
            debug(result);
        });
        //-------------------

        //------------------
        redis.lrange('task_turn_downloading_files', [0, -1], (err, result) => {
            if (err) return debug(err);
            debug('********* STOP **********');
            debug(' *** turn downloadfiles *** ');
            debug(result);
        });
        //-------------------

        getUserId.userId(redis, socketIo, (err, userId) => {
            if (err) {
                writeLogFile.writeLog('\tError: Невозможно выгрузить файлы, получены некорректные данные');
                return func(new errorsType.receivedIncorrectData('Ошибка: невозможно выгрузить файлы, получены некорректные данные'));
            }

            redis.hmget(`user_authntication:${userId}`, 'login', 'user_name', (err, user) => {
                if (err) {
                    writeLogFile.writeLog(`\tError: ${err.toString()}`);
                    return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                }

                //проверяем соответствие пользователя инициировавшего импорт
                if (user[0] !== userLoginImport) return func(new errorsType.errorAuthenticationUser('Ошибка: текущий пользователь не может остановить эту задачу'));

                redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                    'userNameStopUploadFiles': user[1],
                    'dateTimeStopUploadFiles': +new Date(),
                    'uploadFiles': 'expect'
                }, err => {
                    if (err) {
                        writeLogFile.writeLog(`\tError: ${err.toString()}`);
                        return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                    }

                    downloadManagementFiles.stopRequestDownloadFiles(sourceId, id, (err, sourceId) => {
                        if (err) {
                            if (typeof err.cause === 'undefined') writeLogFile.writeLog(`\tError: ${err.message}`);
                            else writeLogFile.writeLog(`\tError: ${err.cause}`);

                            func(err);
                        } else {
                            func(null, sourceId);
                        }
                    });
                });
            });
        });
    });
};