/*
 * Выполнение остановки процесса фильтрации
 *
 * Версия 0.11, дата релиза 22.05.2017
 * */

'use strict';

const async = require('async');

const getUserId = require('../../libs/users_management/getUserId');
const showNotify = require('../../libs/showNotify');
const errorsType = require('../../errors/errorsType');
const writeLogFile = require('../../libs/writeLogFile');
const objWebsocket = require('../../configure/objWebsocket');
const globalObject = require('../../configure/globalObject');

module.exports = function(socketIo, redis, taskIndex) {
    async.waterfall([
        //проверяем данные отправленные пользователем
        function(callback) {
            let arrayTaskIndex = Object.keys(globalObject.getDataTaskFilter());

            if (!taskIndexIsTrue(taskIndex, arrayTaskIndex)) {
                callback(new errorsType.sourceIsNotConnection('Остановка фильтрации по выбранной задачи невозможна, в настоящее время данная задача не выполняется'));
            } else {
                callback();
            }
        },
        //получаем идентификатор пользователя
        function(callback) {
            getUserId.userId(redis, socketIo, (err, userId) => {
                if (err) {
                    callback(new errorsType.receivedIncorrectData('Ошибка: невозможно выполнить задачу, получены некорректные данные'));
                } else {
                    try {
                        let user = userId.split('_')[1];
                        callback(null, user);
                    } catch (err) {
                        callback(new errorsType.receivedIncorrectData('Ошибка: невозможно выполнить задачу, получены некорректные данные'));
                    }
                }
            });
        },
        //проверка является ли текущий пользователь инициатором выполняемой задачи
        function(user, callback) {
            redis.hmget('task_filtering_all_information:' + taskIndex, 'userLogin', 'sourceId', (err, result) => {
                if (err) return callback(err);

                if (user === result[0]) {
                    callback(null, result[0], result[1]);
                } else {
                    callback(new errorsType.sourceIsNotConnection('Остановка фильтрации по выбранной задачи невозможна, пользователь с логином <strong>' + user + '</strong> не является инициатором задачи'));
                }
            });
        },
        //проверяем есть ли соединение с источником
        function(user, sourceId, callback) {
            let connectionStatus = globalObject.getData('sources', sourceId, 'connectionStatus');

            if ((connectionStatus === null) || (connectionStatus === 'disconnect')) {
                callback(new errorsType.sourceIsNotConnection('Ошибка: источник №<strong>' + sourceId + '</strong> не подключен'));
            } else {
                callback(null, user, sourceId);
            }
        },
        //отправка данных источнику
        function(user, sourceId, callback) {
            let wsConnection = objWebsocket['remote_host:' + sourceId];

            wsConnection.sendUTF(JSON.stringify({
                messageType: 'filtering',
                info: {
                    processing: 'off',
                    taskIndex: taskIndex
                }
            }));

            callback(null, true);
        }
    ], function(err) {
        if (err) {
            if (err.name === 'SourceIsNotConnection') {
                showNotify(socketIo, 'warning', err.message);
            } else if (err.name === 'ReceivedIncorrectData') {
                showNotify(socketIo, 'danger', err.message);
            } else {
                showNotify(socketIo, 'danger', 'Внутренняя ошибка сервера, невозможно остановить задачу');
                writeLogFile.writeLog('\tError: ' + err.toString());
            }
        } else {
            showNotify(socketIo, 'success', 'Запрос на остановку задачи отправлен');
        }
    });
};

//проверка совпадение индекса задачи
function taskIndexIsTrue(searchTaskIndex, arrayTaskIndex) {
    return arrayTaskIndex.some(function(item) {
        return item === searchTaskIndex;
    });
}