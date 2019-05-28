/**
 * Модуль обеспечивающий повторную отправку задачи на фильтрацию
 * 
 * Версия 0.1, дата релиза 25.02.2019
 */

'use strict';

const crypto = require('crypto');

const getUserId = require('../../libs/users_management/getUserId');
const objWebsocket = require('../../configure/objWebsocket');
const createTableIndexSettings = require('../../libs/management_index/createTableIndexSettings');

/**
 * @param redis дескриптор соединения с БД
 * @param socketIo дескриптор соединения через socketIo
 * @param taskID ID задачи
 * @param cb функция обратного вызова
 */
module.exports = function(redis, socketIo, taskIndex, cb) {
    new Promise((resolve, reject) => {
        //получаем данные о пользователе
        getUserId.userId(redis, socketIo, (err, userId) => {
            if (err) {
                return reject(new errorsType.receivedIncorrectData(`Ошибка: невозможно запустить фильтрацию на источнике №<strong>${obj.sourceId}</strong>, некорректный идентификатор пользователя`, `\tError: unable to start filtering on source №<strong>${obj.sourceId}</strong>, invalid user ID`));
            }

            if (userId === null || !(~userId.indexOf('_'))) {
                return reject(new errorsType.errorAuthenticationUser('Ошибка: пользователь не авторизован', '\tError: the user is not authorized'));
            }

            let userLogin = userId.split('_')[1];
            redis.hget('user_authntication:' + userId, 'user_name', (err, userName) => {
                if (err) reject(new errorsType.undefinedServerError('Ошибка: внутренняя ошибка сервера, невозможно запустить задачу', `\tError: ${err.message}`));
                else resolve({
                    userName: userName,
                    userLogin: userLogin
                });
            });
        });
    }).then(userSettings => {
        return new Promise((resolve, reject) => {
            //получаем все параметры фильтрации по данной задаче
            redis.hmget(`task_filtering_all_information:${taskIndex}`,
                'sourceId',
                'filterSettings',
                'filterUseIndex', (err, result) => {
                    if (err) reject(err);
                    else resolve({
                        taskIndex: getUniqueId(result[0]),
                        userName: userSettings.userName,
                        userLogin: userSettings.userLogin,
                        sourceId: result[0],
                        filterSettings: result[1],
                        filterUseIndex: (result[2] === 'false' ? false : true)
                    });
                });
        });
    }).then(taskSettings => {
        return new Promise((resolve, reject) => {
            //создаем аналогичную задачу с другим ID
            redis.hmset(`task_filtering_all_information:${taskSettings.taskIndex}`, {
                'userName': taskSettings.userName,
                'userLogin': taskSettings.userLogin,
                'userLoginImport': 'null',
                'dateTimeAddTaskFilter': +new Date(),
                'dateTimeStartFilter': 'null',
                'dateTimeEndFilter': 'null',
                'sourceId': taskSettings.sourceId,
                'filterSettings': taskSettings.filterSettings,
                'filterUseIndex': taskSettings.filterUseIndex,
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
                if (err) reject(err);
                else resolve(taskSettings);
            });
        });
    }).then(taskSettings => {
        return new Promise((resolve, reject) => {
            redis.zadd('task_filtering_index_all', [+new Date(), taskSettings.taskIndex], err => {
                if (err) reject(err);
                else resolve(taskSettings);
            });
        });
    }).then(taskSettings => {
        //отправляем новую задачу и обновляем страницу
        let filterSettings = JSON.parse(taskSettings.filterSettings);

        let wsConnection = objWebsocket[`remote_host:${taskSettings.sourceId}`];

        if (typeof wsConnection === 'undefined') throw (new Error('the source is not connected'));

        let objIpAndNetwork = getArrayIpOrNetwork(filterSettings.ipaddress, filterSettings.network);

        let dtStart = filterSettings.dateTimeStart.split(/\.|\s|:/);
        let dtEnd = filterSettings.dateTimeEnd.split(/\.|\s|:/);
        let objTaskFilter = {
            'messageType': 'filtering',
            'info': {
                'processing': 'on',
                'taskIndex': taskSettings.taskIndex,
                'settings': {
                    'dateTimeStart': ((+new Date(dtStart[2], (dtStart[1] - 1), dtStart[0], dtStart[3], dtStart[4], 0)) / 1000),
                    'dateTimeEnd': ((+new Date(dtEnd[2], (dtEnd[1] - 1), dtEnd[0], dtEnd[3], dtEnd[4], 0)) / 1000),
                    'ipaddress': objIpAndNetwork.ip,
                    'network': objIpAndNetwork.network,
                    'useIndexes': taskSettings.filterUseIndex,
                    'countFilesFiltering': 0,
                    'totalNumberFilesFilter': 0,
                    'countIndexesFiles': [0, 0]
                }
            }
        };

        wsConnection.sendUTF(JSON.stringify(objTaskFilter));

        return {
            sourceID: taskSettings.sourceId,
            taskIndex: taskSettings.taskIndex
        };
    }).then(obj => {
        return new Promise((resolve, reject) => {
            createTableIndexSettings(redis, obj.taskIndex, err => {
                if (err) reject(err);
                else resolve(obj.sourceID);
            });
        });
    }).then(sourceID => {
        cb(null, sourceID);
    }).catch(err => {
        cb(err);
    });
};

//получить массив адресов или подсетей
function getArrayIpOrNetwork() {
    let arrayIPAddress = [];
    let arrayNetwork = [];

    let strings = arguments;

    for (let key in strings) {
        if (strings[key] === null) continue;

        let arrayIPOrNetwork = strings[key].split(',');

        arrayIPOrNetwork.forEach((item) => {
            if (~item.indexOf('/')) arrayNetwork.push(item);
            else arrayIPAddress.push(item);
        });
    }

    return {
        ip: arrayIPAddress,
        network: arrayNetwork
    }
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