/**
 * Модуль выполняющий возобновление задачи по фильтрации сет. трафика
 * 
 * Версия 0.1, дата релиза 29.05.2018
 */

'use strict';

const errorsType = require('../../errors/errorsType');
const showNotify = require('../../libs/showNotify');
const globalObject = require('../../configure/globalObject');
const writeLogFile = require('../../libs/writeLogFile');
const routingRequestFilterFiles = require('../routing_requests/routingRequestFilterFiles');
const processingListFilesForFiltering = require('../../libs/list_file_management/processingListFilesForFiltering');

/**
 * 
 * @param {*} socketIo - дискриптор соединения по протоколу socketIo 
 * @param {*} redis - дискриптор соединения с СУБД Redis
 * @param {*} taskIndex - уникальный идентификатор задачи
 */
module.exports = function(socketIo, redis, taskIndex) {
    console.log('RESUME FILTERING start....');

    new Promise((resolve, reject) => {
        //получаем идентификатор источника
        redis.hmget(`task_filtering_all_information:${taskIndex}`,
            'sourceId',
            'filterSettings',
            (err, result) => {
                if (err) reject(err);
                else resolve({ sourceId: result[0], filterSettings: result[1] });
            });
    }).then((objectParameters) => {
        //проверяем есть ли соединение с источником
        let connectionStatus = globalObject.getData('sources', objectParameters.sourceId, 'connectionStatus');

        if ((connectionStatus === null) || (connectionStatus === 'disconnect')) {
            throw new errorsType.sourceIsNotConnection(`Ошибка: источник №${objectParameters.sourceId} не подключен`);
        } else {
            return objectParameters;
        }
    }).then((objectParameters) => {
        //получить объект содержащий списки файлов по которым необходимо возобновить фильтрацию
        return processingListFilesForFiltering.getList(objectParameters.sourceId, taskIndex, redis)
            .then((listFilterFiles) => {
                if (Object.keys(listFilterFiles) === 0) {
                    throw new errorsType.receivedIncorrectData('Ошибка: невозможно выполнить задачу, получены некорректные данные');
                }

                //отправляем список файлов по которым нужно возобновить фильтрацию
                routingRequestFilterFiles({
                    'sourceId': objectParameters.sourceId,
                    'taskIndex': taskIndex,
                    'filterSettings': objectParameters.filterSettings,
                    'listFilterFiles': listFilterFiles
                }, (err) => {
                    if (err) throw err;
                });
            }).catch((err) => {
                throw err;
            });
    }).catch((err) => {

        console.log(err);

        let error = '';
        let errMessage = err.message;
        if (err.name === 'SourceIsNotConnection') {
            error = 'source is not connected';
        } else if (err.name === 'ReceivedIncorrectData') {
            error = 'incorrect data received';
        } else {
            error = err.toString();
            errMessage = 'Внутренняя ошибка сервера, невозможно возобновить выполнение задачи';
        }

        showNotify(socketIo, 'danger', errMessage);
        writeLogFile.writeLog('\tError: ' + error);
    });
};