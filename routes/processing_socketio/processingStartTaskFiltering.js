/*
 * Подготовка задания для выполнения процесса фильтрации на выбранном сенсоре
 *
 * выполняется:
 * 1. проверка полученных от пользователя данных
 * 2. создания вспомогательного индекса task_filtering_index_all
 * 3. сохранение полной информации по заданию фильтрации в task_filtering_all_information
 * 4. отправка задания источнику
 *
 * Версия 0.13, дата релиза 04.06.2018
 * */

'use strict';

const async = require('async');
const crypto = require('crypto');

const getUserId = require('../../libs/users_management/getUserId');
const showNotify = require('../../libs/showNotify');
const errorsType = require('../../errors/errorsType');
const indexesAPI = require('../../libs/third_party_APIs/indexesAPI');
const writeLogFile = require('../../libs/writeLogFile');
const objWebsocket = require('../../configure/objWebsocket');
const globalObject = require('../../configure/globalObject');
const checkUserData = require('../../libs/helpers/checkUserData');
const createTableIndexSettings = require('../../libs/management_index/createTableIndexSettings');
const routingRequestFilterFiles = require('../../routes/routing_requests/routingRequestFilterFiles');
const processingListFilesForFiltering = require('../../libs/list_file_management/processingListFilesForFiltering');


/**
 * 
 * @param {*} redis дескриптор БД
 * @param {*} obj объект с информацией для выполнения фильтрации
 * @param {*} socketIo дескриптор соединения socketio
 */
module.exports = function(redis, obj, socketIo) {
    let taskIndex = getUniqueId(obj.sourceId);

    async.waterfall([
        //проверяем данные отправленные пользователем
        callback => {
            checkUserData(obj, (trigger) => {
                callback(null, trigger);
            });
        },
        //получаем идентификатор пользователя
        (trigger, callback) => {
            if (!trigger) {
                return callback(new errorsType.receivedIncorrectData(`Ошибка: невозможно запустить фильтрацию на источнике №<strong>${obj.sourceId}</strong>, получены некорректные данные`, `\tError: unable to start filtering on source №<strong>${obj.sourceId}</strong>, incorrect data received`));
            }

            getUserId.userId(redis, socketIo, (err, userId) => {
                if (err) {
                    return callback(new errorsType.receivedIncorrectData(`Ошибка: невозможно запустить фильтрацию на источнике №<strong>${obj.sourceId}</strong>, некорректный идентификатор пользователя`, `\tError: unable to start filtering on source №<strong>${obj.sourceId}</strong>, invalid user ID`));
                }

                if (userId === null || !(~userId.indexOf('_'))) {
                    socketIo.emit('error authentication user', { processingType: 'authentication user', information: 'not authentication' });

                    return callback(new errorsType.errorAuthenticationUser('Ошибка: пользователь не авторизован', '\tError: the user is not authorized'));
                }

                let userLogin = userId.split('_')[1];
                redis.hget('user_authntication:' + userId, 'user_name', (err, userName) => {
                    if (err) {
                        return callback(new errorsType.undefinedServerError('Ошибка: внутренняя ошибка сервера, невозможно запустить задачу', `\tError: ${err.message}`));
                    }

                    callback(null, {
                        userName: userName,
                        userLogin: userLogin
                    });
                });
            });
        },
        //проверяем есть ли соединение с источником
        (object, callback) => {
            let connectionStatus = globalObject.getData('sources', obj.sourceId, 'connectionStatus');

            if (connectionStatus === null || connectionStatus === 'disconnect') {
                return callback(new errorsType.sourceIsNotConnection(`Ошибка: источник №<strong>${obj.sourceId}</strong> не подключен`, `source №<strong>${obj.sourceId}</strong> not connected`));
            }

            callback(null, object);
        },
        //добавляется информация в task_filtering_index_all (УПОРЯДОЧНЫЕ МНОЖЕСТВА)
        (object, callback) => {
            redis.zadd('task_filtering_index_all', [+new Date(), taskIndex], (err) => {
                if (err) return callback(new errorsType.undefinedServerError('Ошибка: внутренняя ошибка сервера, невозможно запустить задачу', `\tError: ${err.message}`));

                callback(null, object);
            });
        },
        //обрабатываем пользовательские данные
        (object, callback) => {
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
                    });
                }
                num++;
            });
        },
        //модуль обращения к стороннему API для получения индексов
        (object, arrayIPAndNetwork, callback) => {
            indexesAPI(object, taskIndex, (err, indexIsExist, taskIndex) => {
                callback(null, object, arrayIPAndNetwork, indexIsExist);
            });
        },
        //добавляется информация в task_filtering_all_information (ХЕШ ТАБЛИЦА)
        (object, arrayIPAndNetwork, indexIsExist, callback) => {
            let objFilterSettings = {
                'dateTimeStart': object.dateTimeStart,
                'dateTimeEnd': object.dateTimeEnd,
                'ipaddress': object.ipaddress,
                'network': object.network
            };

            redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                'userName': object.userName,
                'userLogin': object.userLogin,
                'userLoginImport': 'null',
                'dateTimeAddTaskFilter': +new Date(),
                'dateTimeStartFilter': 'null',
                'dateTimeEndFilter': 'null',
                'sourceId': obj.sourceId,
                'filterSettings': JSON.stringify(objFilterSettings),
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
            }, err => {
                if (err) callback(new errorsType.undefinedServerError('Ошибка: внутренняя ошибка сервера, невозможно запустить задачу', `\tError: ${err.message}`));
                else callback(null, objFilterSettings, arrayIPAndNetwork, indexIsExist);
            });
        },
        //отправка данных источнику
        (objFilterSettings, arrayIPAndNetwork, indexIsExist, callback) => {
            //если индексы не найденны
            if (!indexIsExist) {
                let wsConnection = objWebsocket[`remote_host:${obj.sourceId}`];

                let dtStart = objFilterSettings.dateTimeStart.split(/\.|\s|:/);
                let dtEnd = objFilterSettings.dateTimeEnd.split(/\.|\s|:/);
                let objTaskFilter = {
                    'messageType': 'filtering',
                    'info': {
                        'processing': 'on',
                        'taskIndex': taskIndex,
                        'settings': {
                            'dateTimeStart': ((+new Date(dtStart[2], (dtStart[1] - 1), dtStart[0], dtStart[3], dtStart[4], 0)) / 1000),
                            'dateTimeEnd': ((+new Date(dtEnd[2], (dtEnd[1] - 1), dtEnd[0], dtEnd[3], dtEnd[4], 0)) / 1000),
                            'ipaddress': arrayIPAndNetwork.arrayIPAddress,
                            'network': arrayIPAndNetwork.arrayNetwork,
                            'useIndexes': indexIsExist,
                            'countFilesFiltering': 0,
                            'totalNumberFilesFilter': 0,
                            'countIndexesFiles': [0, 0]
                        }
                    }
                };

                wsConnection.sendUTF(JSON.stringify(objTaskFilter));

                writeLogFile.writeLog(`\tInfo: the index is not found, the data is successfully sent to the source ${obj.sourceId}`);

                return callback(null);
            }

            processingListFilesForFiltering.getList(obj.sourceId, taskIndex, redis)
                .then((listFilterFiles) => {
                    if (Object.keys(listFilterFiles) === 0) {
                        throw new errorsType.receivedIncorrectData('Ошибка: невозможно выполнить задачу, получены некорректные данные');
                    }

                    //отправляем список файлов по которым нужно возобновить фильтрацию
                    routingRequestFilterFiles({
                        'sourceId': obj.sourceId,
                        'taskIndex': taskIndex,
                        'filterSettings': objFilterSettings,
                        'listFilterFiles': listFilterFiles
                    }, err => {
                        if (err) throw err;
                        else callback(null);
                    });
                }).catch(err => {
                    callback(err);
                });
        }
    ], err => {
        if (err) {
            if (err.name === 'SourceIsNotConnection') showNotify(socketIo, 'warning', err.message);
            else showNotify(socketIo, 'danger', err.message);

            writeLogFile.writeLog(`\tError: ${err.cause}`);
        } else {
            createTableIndexSettings(redis, taskIndex, err => {
                if (!err) return showNotify(socketIo, 'success', 'Запрос на фильтрацию успешно отправлен. Выполняется поиск файлов удовлетворяющих заданным условиям');

                writeLogFile.writeLog(`\tError: ${err.message}`);
                showNotify(socketIo, 'danger', 'Ошибка: ошибка при создании индексов на заданные параметры фильтрации');
            });
        }
    });
};

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