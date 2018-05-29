/*
 * Подготовка задания для выполнения процесса фильтрации на выбранном сенсоре
 *
 * выполняется:
 * 1. проверка полученных от пользователя данных
 * 2. создания вспомогательного индекса task_filtering_index_all
 * 3. сохранение полной информации по заданию фильтрации в task_filtering_all_information
 * 4. отправка задания источнику
 *
 * Версия 0.12, дата релиза 22.05.2018
 * */

'use strict';

const debug = require('debug')('processingFiltering');

const async = require('async');
const crypto = require('crypto');
const validator = require('validator');

const getUserId = require('../../libs/users_management/getUserId');
const showNotify = require('../../libs/showNotify');
const errorsType = require('../../errors/errorsType');
const indexesAPI = require('../../libs/thirdPartyAPIs/indexesAPI');
const writeLogFile = require('../../libs/writeLogFile');
const objWebsocket = require('../../configure/objWebsocket');
const globalObject = require('../../configure/globalObject');
const createTableIndexSettings = require('../../libs/management_index/createTableIndexSettings');
const processingListFilesForFiltering = require('../../libs/list_file_management/processingListFilesForFiltering');

let resumeFiltering = function(redis, obj, socketIo) {

};

let startFiltering = function(redis, obj, socketIo) {
    let uniqueTaskId = getUniqueId(obj.sourceId);

    async.waterfall([
        //проверяем данные отправленные пользователем
        function(callback) {
            checkUserData(obj, (trigger) => {
                callback(null, trigger);
            });
        },
        //получаем идентификатор пользователя
        function(trigger, callback) {
            if (!trigger) return callback(new errorsType.receivedIncorrectData('Ошибка: невозможно запустить фильтрацию на источнике №<strong>' + obj.sourceId + '</strong>, получены некорректные данные'));

            getUserId.userId(redis, socketIo, (err, userId) => {
                if (err) return callback(new errorsType.receivedIncorrectData('Ошибка: невозможно запустить фильтрацию на источнике №<strong>' + obj.sourceId + '</strong>, некорректный идентификатор пользователя'));

                if (userId === null || !(~userId.indexOf('_'))) {
                    socketIo.emit('error authentication user', { processingType: 'authentication user', information: 'not authentication' });
                    return callback(new errorsType.errorAuthenticationUser('Ошибка: пользователь не авторизован'));
                }

                let userLogin = userId.split('_')[1];
                redis.hget('user_authntication:' + userId, 'user_name', (err, userName) => {
                    if (err) callback(new errorsType.undefinedServerError('Ошибка: внутренняя ошибка сервера, невозможно запустить задачу', err.toString()));
                    else callback(null, {
                        userName: userName,
                        userLogin: userLogin
                    });
                });
            });
        },
        //проверяем есть ли соединение с источником
        function(object, callback) {
            let connectionStatus = globalObject.getData('sources', obj.sourceId, 'connectionStatus');

            if (connectionStatus === null || connectionStatus === 'disconnect') {
                callback(new errorsType.sourceIsNotConnection('Ошибка: источник №<strong>' + obj.sourceId + '</strong> не подключен'));
            } else {
                callback(null, object);
            }
        },
        //добавляется информация в task_filtering_index_all (УПОРЯДОЧНЫЕ МНОЖЕСТВА)
        function(object, callback) {
            redis.zadd('task_filtering_index_all', [+new Date(), uniqueTaskId], (err) => {
                if (err) return callback(new errorsType.undefinedServerError('Ошибка: внутренняя ошибка сервера, невозможно запустить задачу', err.toString()));
                else callback(null, object, uniqueTaskId);
            });
        },
        //обрабатываем пользовательские данные
        function(object, uniqueTaskId, callback) {
            let arrayIPOrNetwork = obj.ipOrNetwork.split(',');

            let arrayIPAddress = [];
            let arrayNetwork = [];
            let num = 1;
            arrayIPOrNetwork.forEach((item) => {
                if (~item.indexOf('/')) arrayNetwork.push(item);
                else arrayIPAddress.push(item);

                if (num === arrayIPOrNetwork.length) {
                    let ipaddress = (arrayIPAddress.length === 0) ? null : arrayIPAddress.join();
                    let network = (arrayNetwork.length === 0) ? null : arrayNetwork.join();

                    object.sourceId = obj.sourceId;
                    object.ipaddress = ipaddress;
                    object.network = network;
                    object.dateTimeStart = obj.dateTimeStart;
                    object.dateTimeEnd = obj.dateTimeEnd;

                    callback(null, object, {
                        arrayIPAddress,
                        arrayNetwork
                    }, uniqueTaskId);
                }
                num++;
            });
        },
        //модуль обращения к стороннему API для получения индексов
        function(object, arrayIPAndNetwork, uniqueTaskId, callback) {
            indexesAPI(object, uniqueTaskId, (err, indexIsExist, taskIndex) => {
                callback(null, object, arrayIPAndNetwork, indexIsExist);
            });
        },

        //получаем ip-адреса и подсети
        function(object, arrayIPAndNetwork, indexIsExist, callback) {
            let objFilterSettings = {
                'dateTimeStart': object.dateTimeStart,
                'dateTimeEnd': object.dateTimeEnd,
                'ipaddress': object.ipaddress,
                'network': object.network
            };

            callback(null, object, objFilterSettings, arrayIPAndNetwork, indexIsExist);
        },
        //добавляется информация в task_filtering_all_information (ХЕШ ТАБЛИЦА)
        function(object, objFilterSettings, arrayIPAndNetwork, indexIsExist, callback) {
            let filterSettingsJSON = JSON.stringify(objFilterSettings);

            /** 
             *         !!!!   ВНИМАНИЕ   !!!!!!!!!!
             *  поля 'filterUseIndex' и 'filterListFiles' заполняются после взаимодействия с API системы индексации
             * в перспективе доделать, а пока поле 'filterUseIndex' = false, а поле 'filterListFiles' пустое
             */

            redis.hmset('task_filtering_all_information:' + uniqueTaskId, {
                'userName': object.userName,
                'userLogin': object.userLogin,
                'userLoginImport': 'null',
                'dateTimeAddTaskFilter': +new Date(),
                'dateTimeStartFilter': 'null',
                'dateTimeEndFilter': 'null',
                'sourceId': obj.sourceId,
                'filterSettings': filterSettingsJSON,
                'filterUseIndex': indexIsExist,
                'jobStatus': 'expect',
                'directoryFiltering': 'null',
                'countDirectoryFiltering': 0,
                'countFullCycle': 0,
                'countCycleComplete': 0,
                'countFilesFiltering': 0,
                'countFilesChunk': 0,
                'countFilesFound': 0,
                'countFilesProcessed': 0,
                'countFilesUnprocessed': 0,
                'countMaxFilesSize': 0,
                'countFoundFilesSize': 0,
                'uploadFiles': 'not loaded',
                'countFilesLoaded': 0,
                'countFilesLoadedError': 0,
                'listFilesUnprocessing': 'null',
                'uploadDirectoryFiles': 'null',
                'userNameStartUploadFiles': 'null',
                'userNameStopUploadFiles': 'null',
                'userNameContinueUploadFiles': 'null',
                'dateTimeStartUploadFiles': 'null',
                'dateTimeEndUploadFiles': 'null',
                'dateTimeStopUploadFiles': 'null',
                'dateTimeContinueUploadFiles': 'null',
                'userNameLookedThisTask': 'null',
                'dateTimeLookedThisTask': 'null'
            }, function(err) {
                if (err) callback(new errorsType.undefinedServerError('Ошибка: внутренняя ошибка сервера, невозможно запустить задачу', err.toString()));
                else callback(null, objFilterSettings, arrayIPAndNetwork, indexIsExist);
            });
        },
        //отправка данных источнику
        function(objFilterSettings, arrayIPAndNetwork, indexIsExist, callback) {

            debug(arrayIPAndNetwork);

            objFilterSettings.ipaddress = arrayIPAndNetwork.arrayIPAddress;
            objFilterSettings.network = arrayIPAndNetwork.arrayNetwork;

            let dtStart = objFilterSettings.dateTimeStart.split(/\.|\s|:/);
            let dtEnd = objFilterSettings.dateTimeEnd.split(/\.|\s|:/);

            objFilterSettings.dateTimeStart = (+new Date(dtStart[2], (dtStart[1] - 1), dtStart[0], dtStart[3], dtStart[4], 0)) / 1000;
            objFilterSettings.dateTimeEnd = (+new Date(dtEnd[2], (dtEnd[1] - 1), dtEnd[0], dtEnd[3], dtEnd[4], 0)) / 1000;

            let objTaskFilter = {
                'messageType': 'filtering',
                'info': {
                    'processing': 'on',
                    'taskIndex': uniqueTaskId,
                    'settings': objFilterSettings,
                    'useIndexes': indexIsExist,
                    'countIndexesFiles': [0, 0]
                }
            };

            let wsConnection = objWebsocket['remote_host:' + obj.sourceId];

            //если индексы не найденны
            if (!indexIsExist) {
                debug(objTaskFilter);
                wsConnection.sendUTF(JSON.stringify(objTaskFilter));

                return callback(null, uniqueTaskId);
            }

            //если есть индексы то получить список файлов сформированный в результате обработки индексов
            processingListFilesForFiltering.getList(obj.sourceId, uniqueTaskId, redis)
                .then((listFilesIndexes) => {
                    //делим списки файлов на фрагменты и считаем их количество
                    let [countChunk, arrayListFilesIndex] = transformListIndexFiles(listFilesIndexes);

                    debug(countChunk);
                    debug(arrayListFilesIndex);

                    let patternObj = {
                        'messageType': 'filtering',
                        'info': {
                            'processing': 'on',
                            'taskIndex': uniqueTaskId,
                            'useIndexes': true,
                            'settings': {
                                'countIndexesFiles': '',
                                'listFilesFilter': ''
                            }
                        }
                    };

                    new Promise((resolve, reject) => {
                        let num = 0;
                        let promises = arrayListFilesIndex.map(key => {
                            num++;
                            (function() {
                                try {
                                    patternObj.info.settings.countIndexesFiles = [num, countChunk];
                                    patternObj.info.settings.listFilesFilter = key;

                                    wsConnection.sendUTF(JSON.stringify(patternObj));
                                } catch (err) {
                                    throw err;
                                }
                            })();
                        });

                        return Promise.all(promises);
                    }).then(() => {
                        callback(null, uniqueTaskId);
                    }).catch((err) => {
                        callback(err);
                    });

                    //wsConnection.sendUTF(JSON.stringify(objTaskFilter));
                })
                .catch((err) => {
                    callback(err);
                });
        }
    ], function(err, taskIndex) {
        if (err) {
            if (err.name === 'SourceIsNotConnection') showNotify(socketIo, 'warning', err.message);
            else if (err.name === 'ReceivedIncorrectData') showNotify(socketIo, 'danger', err.message);
            else showNotify(socketIo, 'danger', err.message);

            writeLogFile.writeLog('\tError: ' + err.cause);
        } else {
            createTableIndexSettings(redis, taskIndex, (err) => {
                if (err) {
                    writeLogFile.writeLog('\tError: ' + err.message);
                    showNotify(socketIo, 'danger', 'Ошибка: ошибка при создании индексов на заданные параметры фильтрации');
                } else {
                    showNotify(socketIo, 'success', 'Запрос на фильтрацию успешно отправлен. Выполняется поиск файлов удовлетворяющих заданным условиям');
                }
            });
        }
    });
};

//делим списки файлов на фрагменты и считаем их количество
function transformListIndexFiles(listFilesIndexes) {
    const sizeChunk = 30;

    let maxSegmentSize = 0;
    let listFiles = [];
    let obj = {};

    for (let key in listFilesIndexes) {
        if (!~key.indexOf(':')) continue;

        let tmp = key.split(':');
        if (tmp.length < 4) continue;

        if (maxSegmentSize < listFilesIndexes[key].length) maxSegmentSize = listFilesIndexes[key].length;
        obj[key] = tmp[3];
    }

    let countChunk = Math.floor(maxSegmentSize / sizeChunk);
    let y = maxSegmentSize / sizeChunk;

    if ((y - countChunk) === 0) countChunk++;

    for (let i = 0; i < countChunk; i++) {
        let newObj = {};
        for (let index in obj) {
            newObj[index[obj]] = listFilesIndexes[index].splice(0, (sizeChunk + 1));
        }
        listFiles.push(newObj);
    }

    return { countChunk, listFiles };
}

//проверка данных полученных от пользователя
function checkUserData(obj, func) {
    //let patternIp = new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$');
    let patternNet = new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)[.]){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)/[0-9]{1,2}$');
    //цифрового проверка идентификатора источника
    let isSourceIdTrue = validator.isInt(obj.sourceId);

    //проверка даты и времени
    let patternDataTime = new RegExp('^(\\d{2}).(\\d{2}).(\\d{4})\\s(\\d{2}):(\\d{2})$');
    let isDateTimeStartTrue = patternDataTime.test(obj.dateTimeStart);
    let isDateTimeEndTrue = patternDataTime.test(obj.dateTimeEnd);

    //проверка перечня ip-адресов и подсетей
    let arrayTmp = obj.ipOrNetwork.split(',');
    let isIpOrNetworkTrue = arrayTmp.every((item) => {
        if (~item.indexOf('/')) return patternNet.test(item);
        else return validator.isIP(item);
    });

    if ((+new Date(obj.dateTimeStart) >= (+new Date(obj.dateTimeEnd)))) return func(false);

    let trigger = (isSourceIdTrue && isDateTimeStartTrue && isDateTimeEndTrue && isIpOrNetworkTrue) ? true : false;
    func(trigger);
}

//получить уникальный идентификатор задачи
function getUniqueId(sourceId) {
    let randomValue = Math.random().toString(36).substr(2);
    let md5string = crypto.createHash('md5')
        .update('sourceId')
        .update(sourceId)
        .update(randomValue)
        .digest('hex');

    return md5string;
}

module.exports = {
    startFiltering,
    resumeFiltering
};