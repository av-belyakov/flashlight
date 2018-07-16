/*
 * Модуль выполняющий обработку заданий по загрузке файлов
 *
 * Версия 0.4, дата релиза 10.07.2018
 * */

'use strict';

const async = require('async');

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
        function(callback) {
            redis.hget(`task_filtering_all_information:${taskIndex}`, 'sourceId', function(err, sourceID) {
                if (err) callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                else callback(null, sourceID);
            });
        },
        //проверяем есть ли соединение с источником
        function(sourceID, callback) {
            let connectionStatus = globalObject.getData('sources', sourceID, 'connectionStatus');

            if (connectionStatus === null || connectionStatus === 'disconnect') {
                callback(new errorsType.sourceIsNotConnection(`Ошибка: источник №<strong>${sourceID}</strong> не подключен`));
            } else {
                callback(null, sourceID);
            }
        },
        //проверяем есть ли в очереди на загрузку задача с соответствующим идентификатором
        function(sourceID, callback) {
            redis.lrange('task_turn_downloading_files', [0, -1], function(err, list) {
                if (err) return callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));

                let isTrue = list.some((item) => ((`${sourceID}:${taskIndex}`) === item));

                if (isTrue) callback(new errorsType.taskIndexAlreadyExistToTurn(`Задача на экспорт сетевого трафика с идентификатором ${taskIndex} уже добавлена в очередь`));
                else callback(null, sourceID);
            });
        },
        //добавление задачи в очередь (загрузка данных в таблицу task_turn_downloading_files)
        function(sourceID, callback) {
            redis.rpush('task_turn_downloading_files', `${sourceID}:${taskIndex}`, function(err) {
                if (err) callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                else callback(null, sourceID);
            });
        },
        //проверка осуществления загрузки файлов с указанного источника (идентификатор источника в таблице task_implementation_downloading_files)
        function(sourceID, callback) {
            redis.exists('task_implementation_downloading_files', function(err, result) {
                if (err) return callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));

                //если таблица task_implementation_downloading_files не существует
                if (result === 0) return callback(null, sourceID, false);

                //проверяем существует ли идентификатор в таблице task_implementation_downloading_files
                checkSoursIdTableTaskImplementationDownloadingFiles(redis, sourceID, function(err, taskIsPerformed) {
                    if (err) callback(new errorsType.undefinedServerError('Внутренняя ошибка сервера', err.toString()));
                    else callback(null, sourceID, taskIsPerformed);
                });
            });
        }
    ], function(err, sourceID, taskIsPerformed) {
        if (err) {
            if (err.name === 'errorRedisDataBase') {
                writeLogFile.writeLog('\tError: ' + err.cause);
            }

            return cb(err);
        }


        //------------------ ДЛЯ ТЕСТОВ
        redis.lrange('task_implementation_downloading_files', [0, -1], (err, result) => {
            if (err) return debug(err);

            debug('********* START **********');
            debug(' +++ downloadfiles +++ ');
            debug(result);
        });
        //-------------------

        //------------------ ДЛЯ ТЕСТОВ
        redis.lrange('task_turn_downloading_files', [0, -1], (err, result) => {
            if (err) return debug(err);

            debug('********* START **********');
            debug(' *** turn downloadfiles *** ');
            debug(result);
        });
        //-------------------

        debug(data.listFiles);

        if (taskIsPerformed) return new errorsType.errorLoadingFile('Ошибка: в настоящее время задача с заданным ID уже выполняется');

        //формируем и отправляем выбранному источнику запрос на выгрузку файлов в формате JSON
        downloadManagementFiles.startRequestDownloadFiles(redis, socketIo, {
            sourceId: sourceID,
            taskIndex: taskIndex,
            listFiles: data.listFiles
        }).then(() => {
            //создаем псевдоиндекс, таблица task_uploaded_index_all
            redis.zadd('task_uploaded_index_all', [+new Date(), taskIndex], (err) => {
                if (err) writeLogFile.writeLog('\tError: ' + err.toString());
            });

            cb(null, sourceID);
        }).catch((err) => {
            if (typeof err.cause === 'undefined') writeLogFile.writeLog('\tError: ' + err.message);
            else writeLogFile.writeLog('\tError: ' + err.cause);

            cb(err);
        });

        /* if (isTrue) {
             new Promise((resolve, reject) => {
                 //получаем ID пользователя
                 getUserId.userId(redis, socketIo, (err, userId) => {
                     if (err) {
                         writeLogFile.writeLog('\tError: Невозможно выгрузить файлы, получены некорректные данные');
                         reject(new errorsType.receivedIncorrectData('Ошибка: невозможно выгрузить файлы, получены некорректные данные'));
                     } else {
                         resolve(userId);
                     }
                 });
             }).then((userId) => {
                 //по ID получаем имя и логин пользователя
                 new Promise((resolve, reject) => {
                     redis.hmget(`user_authntication:${userId}`, 'login', 'user_name', (err, user) => {
                         if (err) {
                             writeLogFile.writeLog('\tError: ' + err.toString());
                             reject(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                         } else {
                             resolve(user);
                         }
                     });
                 });
             }).then((user) => {
                 //записываем информацию о пользователе инициализировавшем загрузку
                 new Promise((resolve, reject) => {
                     redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                         'userLoginImport': user[0],
                         'userNameStartUploadFiles': user[1],
                         'dateTimeStartUploadFiles': +new Date(),
                         'userNameStopUploadFiles': 'null',
                         'dataTimeStopUploadFiles': 'null',
                         'uploadFiles': 'in line'
                     }, (err) => {
                         if (err) {
                             writeLogFile.writeLog('\tError: ' + err.toString());
                             reject(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                         } else {
                             resolve();
                         }
                     });
                 });
             }).then(() => {
                 //добавляем информацию о задаче в глобальный объект
                 globalObject.setData('processingTasks', taskIndex, {
                     'taskType': 'upload',
                     'sourceId': sourceId,
                     'status': 'in line',
                     'timestampStart': +new Date(),
                     'timestampModify': +new Date()
                 });

                 //добавляем в очередь
                 func(null, sourceId);
             }).catch((err) => {
                 func(err);
             });
         } else {

             debug(data.listFiles);

             //выгрузка сет. трафика
             redis.rpush('task_implementation_downloading_files', `${sourceId}:${taskIndex}`, function(err) {
                 if (err) return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));

                 //формируем и отправляем выбранному источнику запрос на выгрузку файлов в формате JSON
                 downloadManagementFiles.startRequestDownloadFiles(redis, {
                     sourceId: sourceId,
                     taskIndex: taskIndex,
                     listFiles: data.listFiles
                 }, socketIo, function(err) {
                     if (err) {
                         if (typeof err.cause === 'undefined') writeLogFile.writeLog('\tError: ' + err.message);
                         else writeLogFile.writeLog('\tError: ' + err.cause);

                         func(err);
                     } else {
                         func(null, sourceId);
                     }
                 });
             });
         }*/
    });
};

/**
 * Отмена задач находящихся в очереди (cancel), выполняется:
 * 1. Удаление информации из очереди задач (таблица task_turn_downloading_files)
 * 2. Изменение следующих параметров в таблице (task_filtering_all_information:*)
 *   - uploadFiles
 *   - userNameStartUploadFiles
 *   - dateTimeStartUploadFiles
 * 
 * @param socketIo - дискриптор соединения по протоколу socketio
 * @param taskIndex - идентификатор задачи
 * @param func - функция обратного вызова
 */
module.exports.cancel = function(socketIo, taskIndex, func) {
    redis.exists('task_turn_downloading_files', function(err, result) {
        if (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
        }

        if (result === 0) {
            //если таблицы нет
            writeLogFile.writeLog('\tError: Задачи с идентификатором ' + taskIndex + ' не существует');
            func(new errorsType.sourceIsExist('Задачи с указанным идентификатором не существует'));
        } else {
            redis.hmget('task_filtering_all_information:' + taskIndex, 'sourceId', 'userLoginImport', function(err, result) {
                if (err) {
                    writeLogFile.writeLog('\tError: ' + err.toString());
                    return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                }
                let [sourceId, userLoginImport] = result;

                getUserId.userId(redis, socketIo, function(err, userId) {
                    if (err) {
                        writeLogFile.writeLog('\tError: Невозможно выгрузить файлы, получены некорректные данные');
                        return func(new errorsType.receivedIncorrectData('Ошибка: невозможно выгрузить файлы, получены некорректные данные'));
                    }

                    redis.hmget('user_authntication:' + userId, 'login', 'user_name', function(err, user) {
                        if (err) {
                            writeLogFile.writeLog('\tError: ' + err.toString());
                            return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                        }

                        //проверяем соответствие пользователя инициировавшего импорт
                        if (user[0] !== userLoginImport) return func(new errorsType.errorAuthenticationUser('Ошибка: текущий пользователь не может отменить эту задачу задачу'));

                        async.parallel([
                            //удаляем идентификатор задачи из таблицы task_turn_downloading_files
                            function(callback) {
                                redis.lrem('task_turn_downloading_files', 0, sourceId + ':' + taskIndex, function(err) {
                                    if (err) callback(err);
                                    else callback(null, true);
                                });
                            },
                            //изменяем параметры в таблице task_filtering_all_information:*
                            function(callback) {
                                redis.hmset('task_filtering_all_information:' + taskIndex, {
                                    'userNameStartUploadFiles': 'null',
                                    'dateTimeStartUploadFiles': 'null',
                                    'uploadFiles': 'not loaded'
                                }, function(err) {
                                    if (err) callback(err);
                                    else callback(null, true);
                                });
                            },
                            //удаляем псевдоиндекс, таблица task_uploaded_index_all
                            function(callback) {
                                redis.zrem('task_uploaded_index_all', taskIndex, function(err) {
                                    if (err) callback(err);
                                    else callback(null, true);
                                });
                            }
                        ], function(err) {
                            if (err) {
                                writeLogFile.writeLog('\tError: ' + err.toString());
                                func(err);
                            } else {
                                func(null, sourceId);
                            }
                        });
                    });
                });
            });
        }
    });
};

/**
 * Останов выполнения задачи по скачиванию файлов
 * 1, Проверка выполняется ли загрузка с выбранного источника (поиск идентификатора сенсора
 *    в таблице task_implementation_downloading_files)
 * 2, Изменение следующих параметров в таблице (task_filtering_all_information:*)
 *   - uploadFiles
 *   - userNameStopUploadFiles
 *   - dateTimeStopUploadFiles
 * 
 * @param socketIo - дискриптор соединения по протоколу socketio
 * @param taskIndex - идентификатор задачи
 * @param func - функция обратного вызова
 */
module.exports.stop = function(socketIo, taskIndex, func) {
    async.waterfall([
        function(callback) {
            redis.exists('task_implementation_downloading_files', function(err, result) {
                if (err) return callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));

                //если таблица task_implementation_downloading_files не существует
                if (result === 0) {
                    callback(new errorsType.taskIndexDoesNotExist('Задачи с указанным идентификатором не существует'));
                } else {
                    callback(null);
                }
            });
        },
        function(callback) {
            redis.hmget('task_filtering_all_information:' + taskIndex, 'sourceId', 'userLoginImport', function(err, result) {
                if (err) callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                else callback(null, result[0], result[1]);
            });
        },
        function(sourceId, userLoginImport, callback) {
            redis.lrange('task_implementation_downloading_files', [0, -1], function(err, list) {
                if (err) return callback(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));

                let id = sourceId + ':' + taskIndex;
                let isTrue = list.some((item) => id === item);

                if (!isTrue) callback(new errorsType.taskIndexDoesNotExist('Задачи с идентификатором ' + id + ' не существует'));
                else callback(null, sourceId, userLoginImport, id);
            });
        }
    ], function(err, sourceId, userLoginImport, id) {
        if (err) {
            if (err.name === 'errorRedisDataBase') writeLogFile.writeLog('\tError: ' + err.cause);
            else writeLogFile.writeLog('\tError: ' + err.message);

            func(err);
        } else {

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

            getUserId.userId(redis, socketIo, function(err, userId) {
                if (err) {
                    writeLogFile.writeLog('\tError: Невозможно выгрузить файлы, получены некорректные данные');
                    return func(new errorsType.receivedIncorrectData('Ошибка: невозможно выгрузить файлы, получены некорректные данные'));
                }

                redis.hmget('user_authntication:' + userId, 'login', 'user_name', function(err, user) {
                    if (err) {
                        writeLogFile.writeLog('\tError: ' + err.toString());
                        return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                    }

                    //проверяем соответствие пользователя инициировавшего импорт
                    if (user[0] !== userLoginImport) return func(new errorsType.errorAuthenticationUser('Ошибка: текущий пользователь не может остановить эту задачу'));

                    redis.hmset('task_filtering_all_information:' + taskIndex, {
                        'userNameStopUploadFiles': user[1],
                        'dateTimeStopUploadFiles': +new Date(),
                        'uploadFiles': 'expect'
                    }, function(err) {
                        if (err) {
                            writeLogFile.writeLog('\tError: ' + err.toString());
                            return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                        }

                        downloadManagementFiles.stopRequestDownloadFiles(sourceId, id, function(err, sourceId) {
                            if (err) {
                                if (typeof err.cause === 'undefined') writeLogFile.writeLog('\tError: ' + err.message);
                                else writeLogFile.writeLog('\tError: ' + err.cause);

                                func(err);
                            } else {
                                func(null, sourceId);
                            }
                        });
                    });
                });
            });
        }
    });
};

/**
 * Возобновление скачивания файлов
 * 1. Проверка выполняется ли уже какая либо загрузка с источника, если да то вывести инф. сообщение
 *    и прекратить работу. Возобновление загрузки может быть выполненно только если источник подключен, нет выполняемых задач
 *    и нет задач находящихся в очереди (все относится к конкретному источнику). Проверка таблиц:
 *   - task_turn_downloading_files
 *   - task_implementation_downloading_files
 *
 * 2. Получаем массив состоящий из имен уже принятых файлов
 * 3. Проверяем что количество принятых файлов меньше чем общее кол-во файлов (таблица task_loading_files:*)
 * 4. Формирование JSON пакета с необходимыми параметрами, втом числе списком имен уже принятых файлов.
 *
 * @param socketIo - дискриптор соединения по протоколу socketio
 * @param taskIndex - идентификатор задачи
 * @param func - функция обратного вызова
 */
module.exports.resume = function(socketIo, taskIndex, func) {
    redis.hget('task_filtering_all_information:' + taskIndex, 'sourceId', function(err, sourceId) {
        if (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
        }
        redis.exists('remote_host_connect:connection', function(err, result) {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера, невозможно возобновить загрузку файлов', err.toString()));
            }

            if (result === 0) return func(new errorsType.sourceNotConnected('Ошибка: выгрузка сетевого трафика невозможна, источник №<strong>' + sourceId + '</strong> не подключен'));
            redis.lrange('remote_host_connect:connection', [0, -1], function(err, list) {
                if (err) {
                    writeLogFile.writeLog('\tError: ' + err.toString());
                    return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера, невозможно возобновить загрузку файлов', err.toString()));
                }

                let isExist = list.some((item) => item === sourceId);
                if (!isExist) return func(new errorsType.sourceNotConnected('Ошибка: выгрузка сетевого трафика невозможна, источник №<strong>' + sourceId + '</strong> не подключен'));

                resumeFilesUpload(sourceId, taskIndex, function(err) {
                    if (err) return func(err);

                    async.series([
                        //удаляем псевдоиндекс, таблица task_uploaded_index_all
                        function(callback) {
                            redis.zrem('task_uploaded_index_all', taskIndex, function(err) {
                                if (err) callback(err);
                                else callback(null, true);
                            });
                        },
                        //создаем псевдоиндекс, таблица task_uploaded_index_all
                        function(callback) {
                            redis.zadd('task_uploaded_index_all', [+new Date(), taskIndex], function(err) {
                                if (err) callback(err);
                                else callback(null, true);
                            });
                        }
                    ], function(err) {
                        if (err) writeLogFile.writeLog('\tError: ' + err.toString());
                        func(null, sourceId);
                    });
                });
            });
        });
    });

    function resumeFilesUpload(sourceId, taskIndex, feedback) {
        async.parallel([
            //проверяем наличие задачи в таблице task_turn_downloading_files
            function(callback) {
                checkTaskDownloadingFiles(sourceId, taskIndex, 'task_turn_downloading_files', function(err, isExist) {
                    if (err) callback(err);
                    else callback(null, isExist);
                });
            },
            //проверяем наличие задачи в таблице task_implementation_downloading_files
            function(callback) {
                checkTaskDownloadingFiles(sourceId, taskIndex, 'task_implementation_downloading_files', function(err, isExist) {
                    if (err) callback(err);
                    else callback(null, isExist);
                });
            }
        ], function(err, arrayIsExist) {
            if (err) {
                writeLogFile.writeLog('\tError: ' + err.toString());
                return feedback(new errorsType.taskIndexDoesNotExist('Ошибка: невозможно возобновить загрузку файлов, некорректный идентификатор задачи'));
            }

            //проверяем есть ли у данного источника выполняющиеся или ожидающие задачи
            if (arrayIsExist.some(item => item)) return feedback(new errorsType.taskIndexAlreadyExistToTurn('Возобновление загрузки файлов с источника №<strong>' + sourceId + '</strong> не возможно, так как источник уже задействован в загрузке файлов'));

            //проверяем статус задачи, поле uploadFiles таблицы task_filtering_all_information:*
            redis.hmget('task_filtering_all_information:' + taskIndex, 'userLoginImport', 'uploadFiles', function(err, resultFilterAllInformation) {
                if (err) {
                    writeLogFile.writeLog('\tError: ' + err.toString());
                    return feedback(new errorsType.receivedIncorrectData('Ошибка: невозможно возобновить загрузку файлов, некорректный идентификатор задачи', err.toString()));
                }

                getUserId.userId(redis, socketIo, function(err, userId) {
                    if (err) {
                        writeLogFile.writeLog('\tError: Ошибка: невозможно выгрузить файлы, получены некорректные данные');
                        return func(new errorsType.receivedIncorrectData('Ошибка: невозможно выгрузить файлы, получены некорректные данные'));
                    }

                    redis.hmget('user_authntication:' + userId, 'login', 'user_name', function(err, user) {
                        if (err) {
                            writeLogFile.writeLog('\tError: ' + err.toString());
                            func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', err.toString()));
                        } else {

                            //проверяем соответствие пользователя инициировавшего импорт
                            if (user[0] !== resultFilterAllInformation[0]) return feedback(new errorsType.errorAuthenticationUser('Ошибка: текущий пользователь не может возобновить загрузку файлов'));

                            //проверяем статус загрузки
                            if (resultFilterAllInformation[1] !== 'suspended') return feedback(new errorsType.receivedIncorrectData('Получены некорректные данные, не верный статус задачи'));

                            //добавляем задачу в таблицу task_implementation_downloading_files
                            redis.rpush('task_implementation_downloading_files', sourceId + ':' + taskIndex, function(err) {
                                if (err) {
                                    writeLogFile.writeLog('\tError: ' + err.toString());
                                    return feedback(new errorsType.receivedIncorrectData('Внутренняя ошибка сервера, невозможно возобновить загрузку файлов', err.toString()));
                                }
                            });

                            //получаем список принятых файлов
                            redis.hgetall('task_loading_files:' + taskIndex, function(err, objFilesName) {
                                if (err) {
                                    writeLogFile.writeLog('\tError: ' + err.toString());
                                    return feedback(new errorsType.receivedIncorrectData('Внутренняя ошибка сервера, невозможно возобновить загрузку файлов', err.toString()));
                                }

                                let arrayNameReceivedFiles = [];
                                let countAllItems = 0,
                                    countReceivedItems = 0;

                                for (let fileName in objFilesName) {
                                    if (~objFilesName[fileName].indexOf('/')) {
                                        let status = objFilesName[fileName].split('/')[2];
                                        if (status === 'successfully') {
                                            arrayNameReceivedFiles.push(fileName);
                                            countReceivedItems++;
                                        }
                                    }
                                    countAllItems++;
                                }
                                if (countAllItems === countReceivedItems) return feedback(new errorsType.receivedIncorrectData('Получены некорректные данные, все файлы по данной задаче уже были выгружены'));

                                downloadManagementFiles.resumeRequestDownloadFiles(redis, sourceId, taskIndex, arrayNameReceivedFiles, socketIo, function(err, sourceId) {
                                    if (err) {
                                        if (typeof err.cause === 'undefined') writeLogFile.writeLog('\tError: ' + err.message);
                                        else writeLogFile.writeLog('\tError: ' + err.cause);

                                        feedback(err);
                                    } else {
                                        feedback(null);
                                    }
                                });
                            });
                        }
                    });
                });
            });
        });
    }

    //проверка наличия задач на фильтрациию
    function checkTaskDownloadingFiles(sourceId, taskIndex, tableName, callback) {
        redis.exists(tableName, function(err, result) {
            if (err) return callback(err);
            if (result === 0) return callback(null, false);

            redis.lrange(tableName, [0, -1], function(err, list) {
                if (err) return callback(err);

                let isTrue = list.some((item) => sourceId === item.split(':')[0]);

                if (isTrue) callback(null, true);
                else callback(null, false);
            });
        });
    }
};