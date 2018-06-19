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
    /*async.forEachOf(objectForCreate.info.listFilesFoundDuringFiltering, (file, callbackForEachOf) => {
        redis.lpush(`task_list_files_found_during_filtering:${objectForCreate.sourceId}:${objectForCreate.taskIndex}`, file, (err) => {
            if (err) callbackForEachOf(err);
            else callbackForEachOf(null);
        });
    }, (err) => {
        if (err) callback(err);
        else callback(null);
    });*/

    new Promise((resolve, reject) => {
        if (!Array.isArray(objectForCreate.filesList)) {
            return Promise.resolve();
        }

        let promises = objectForCreate.filesList.map(file => {
            redis.lpush(`task_list_files_found_during_filtering:${objectForCreate.sourceId}:${objectForCreate.taskIndex}`, file);
        });
        return Promise.all(promises);
    }).then((result, err) => {
        return new Promise((resolve, reject) => {
            if (err) {
                if (callback) callback(err);
                else reject(err);
            } else {
                if (callback) callback();
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