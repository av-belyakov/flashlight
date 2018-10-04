/**
 * Модуль осуществляющий обработку запроса пользователя на остановку задачи по выгрузке файлов
 * 
 * Версия 0.1,дата релиза 03.10.2018
 */

'use strict';

const debug = require('debug')('processingStopTaskDownloadFiles');

const errorsType = require('../../errors/errorsType.js');
const objWebsocket = require('../../configure/objWebsocket');
const globalObject = require('../../configure/globalObject');
const checkAccessRights = require('../../libs/users_management/checkAccessRights');

/**
 * 
 * @param {*} taskIndex - ID задачи
 * @param {*} socketIo - дискриптор соединения с клиентом по протоколу websocket
 * @param {*} redis - дискриптор соединения с БД
 * @param {*} callback - функция обратного вызова
 */
module.exports = function(taskIndex, socketIo, redis, callback) {
    new Promise((resolve, reject) => {

        debug('проверка прав доступа пользователя');

        //проверка прав доступа пользователя
        checkAccessRights(socketIo, 'management_tasks_import', 'stop', (trigger) => {
            if (!trigger) reject(new Error('Не достаточно прав доступа для останова задачи по загрузке найденных файлов'));
            else resolve();
        });
    }).then(() => {

        debug('получаем ID источника');

        //получаем ID источника
        return new Promise((resolve, reject) => {
            redis.hget(`task_filtering_all_information:${taskIndex}`, 'sourceId', (err, sourceID) => {
                if (err) reject(err);
                else resolve(sourceID);
            });
        });
    }).then(sourceID => {

        debug('статус источника (подключен ли он)');

        //статус источника (подключен ли он)
        let connectionStatus = globalObject.getData('sources', sourceID, 'connectionStatus');

        if ((connectionStatus === null) || (connectionStatus === 'disconnect')) {
            throw (new errorsType.sourceIsNotConnection(`Ошибка: источник №<strong>${sourceID}</strong> не подключен`));
        } else {
            return sourceID;
        }
    }).then(sourceID => {
        let wsConnection = objWebsocket[`remote_host:${sourceID}`];

        wsConnection.sendUTF(JSON.stringify({
            messageType: 'download files',
            info: {
                processing: 'stop',
                taskIndex: taskIndex
            }
        }));

        debug('SEND MESSAGE TYPE "STOP" TO MOTH');

        callback(null);
    }).catch(err => {
        callback(err);
    });
};