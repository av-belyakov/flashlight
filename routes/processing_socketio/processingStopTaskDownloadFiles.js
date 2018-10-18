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
 * 
 * @param {*} taskIndex - ID задачи
 */
module.exports = function(taskIndex) {
    let taskInfo = globalObject.getData('processingTasks', taskIndex);

    if ((typeof taskInfo === 'undefined') || (typeof taskInfo.sourceId === 'undefined')) {
        return (new errorsType.receivedIncorrectData('Ошибка: получены некорректные данные, останов задачи по скачиванию файлов не возможен', 'received incorrect data, stopping the task of downloading files is not possible'));
    }

    let sourceID = taskInfo.sourceId;

    //статус источника (подключен ли он)
    let connectionStatus = globalObject.getData('sources', sourceID, 'connectionStatus');

    if ((connectionStatus === null) || (connectionStatus === 'disconnect')) {
        return (new errorsType.sourceIsNotConnection(`Ошибка: источник №<strong>${sourceID}</strong> не подключен`));
    }

    let wsConnection = objWebsocket[`remote_host:${sourceID}`];

    wsConnection.sendUTF(JSON.stringify({
        messageType: 'download files',
        info: {
            processing: 'stop',
            taskIndex: taskIndex
        }
    }));

    return null;
};