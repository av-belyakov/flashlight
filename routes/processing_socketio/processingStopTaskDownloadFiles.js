/**
 * Модуль осуществляющий обработку запроса пользователя на остановку задачи по выгрузке файлов
 * 
 * Версия 0.11,дата релиза 18.10.2018
 */

'use strict';

const errorsType = require('../../errors/errorsType.js');
const objWebsocket = require('../../configure/objWebsocket');
const globalObject = require('../../configure/globalObject');

/**
 * @param {*} redis дискриптор соединения с БД
 * @param {*} taskIndex ID задачи
 * @param {*} cb функция обратного вызова
 */
module.exports = function(redis, taskIndex, cb) {
    redis.hget(`task_filtering_all_information:${taskIndex}`, 'sourceId', (err, sourceID) => {
        if (err) return cb(err);

        //статус источника (подключен ли он)
        let connectionStatus = globalObject.getData('sources', sourceID, 'connectionStatus');

        if ((connectionStatus === null) || (connectionStatus === 'disconnect')) {
            return cb(new errorsType.sourceIsNotConnection(`Ошибка: источник №<strong>${sourceID}</strong> не подключен`));
        }

        let wsConnection = objWebsocket[`remote_host:${sourceID}`];

        wsConnection.sendUTF(JSON.stringify({
            messageType: 'download files',
            info: {
                processing: 'stop',
                taskIndex: taskIndex
            }
        }));

        cb(null);
    });
};