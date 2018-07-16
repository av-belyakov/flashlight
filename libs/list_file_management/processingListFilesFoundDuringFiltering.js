/**
 * Модуль управления списками файлов найденных в результате фильтрации
 * 
 * Версия 0.1, дата релиза 18.06.2018
 * 
 * @param objectForCreate содержит следующие свойства: sourceId, taskIndex, objFilesList
 * @param objectForModify содержит следующие свойства: sourceId, taskIndex, fileName, directoryName
 * 
 * @param Данный модуль, если функция 'callback' не заданна, возвращает Promise 
 */

'use strict';

const async = require('async');

module.exports = {
    createList,
    deleteList,
    modifyList,
    getList
};

/** 
 * создает записи в БД содержащие списки файлов впоследствии используемые для фильтрации
 * 
 * @param objectForCreate
 * - sourceId
 * - taskIndex
 * - filesList (массив файлов)
 */
function createList(objectForCreate, redis, callback) {
    return new Promise((resolve, reject) => {
        async.forEachOf(objectForCreate.filesList, (object, key, callbackForEachOf) => {
            redis.hmset(`task_list_files_found_during_filtering:${objectForCreate.sourceId}:${objectForCreate.taskIndex}`, {
                [object.fileName]: JSON.stringify({
                    'fileSize': object.fileSize,
                    'fileChecket': false,
                    'fileDownloaded': false
                })
            }, (err) => {
                if (err) callbackForEachOf(err);
                else callbackForEachOf(null);
            });
        }, (err) => {
            if (err) {
                if (callback) callback(err);
                else reject(err);
            } else {
                if (callback) callback(null);
                else resolve();
            }
        });
    });
}

/**
 * удаляет списки файлов используемых для фильтрации
 * 
 * @param sourceId - идентификатор источника
 * @param taskIndex - идентификатор задачи
 */
function deleteList(sourceId, taskIndex, redis, callback) {

}

/**
 * удаляет из указанного списка запись о файле
 * 
 * @param objectForModify
 * - sourceId
 * - taskIndex
 * - directoryName
 * - fileName
 */
function modifyList(objectForModify, redis, callback) {

}

/**
 * возвращает объект содержащий списки файлов, пример ( <директория>: <массив файлов> )
 * 
 * @param sourceId - идентификатор источника
 * @param taskIndex - идентификатор задачи
 */
function getList(sourceId, taskIndex, redis, callback) {

}