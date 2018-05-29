/**
 * Модуль выполняющий возобновление задачи по фильтрации сет. трафика
 * 
 * Версия 0.1, дата релиза 29.05.2018
 */

'use strict';

const showNotify = require('../../libs/showNotify');
const writeLogFile = require('../../libs/writeLogFile');
const processingListFilesForFiltering = require('../../libs/list_file_management/processingListFilesForFiltering');

/**
 * 
 * @param {*} socketIo - дискриптор соединения по протоколу socketIo 
 * @param {*} redis - дискриптор соединения с СУБД Redis
 * @param {*} taskIndex - уникальный идентификатор задачи
 */
module.exports = function(socketIo, redis, taskIndex) {
    new Promise((resolve, reject) => {
        //получаем идентификатор источника
        redis.hget('task_filtering_all_information:' + taskIndex, 'sourceId', (err, sourceId) => {
            if (err) reject(err);
            else resolve(sourceId);
        });
    }).then((sourceId) => {
        //получить объект содержащий списки файлов по которым необходимо возобновить фильтрацию
        processingListFilesForFiltering.getList(sourceId, taskIndex, redis)
            .then(() => {

            });
    }).catch((err) => {
        showNotify(socketIo, 'danger', 'Внутренняя ошибка сервера, невозможно остановить задачу');
        writeLogFile.writeLog('\tError: ' + err.toString());
    });

    //получить объект содержащий списки файлов по которым необходимо возобновить фильтрацию
    //processingListFilesForFiltering.getList()

};