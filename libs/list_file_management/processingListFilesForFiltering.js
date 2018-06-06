/**
 * Модуль управления списками файлов по которым выполняется фильтрация
 * 
 * Версия 0.1, дата релиза 20.03.2018
 * 
 * @param objectForCreate содержит следующие свойства: sourceId, taskIndex, objFilesList
 * @param objectForModify содержит следующие свойства: sourceId, taskIndex, fileName, directoryName
 * 
 * @param Данный модуль, если функция 'callback' не заданна, возвращает Promise 
 */

'use strict';

const process = require('process');

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
 * - objFileList (объект с массивами файлов)
 * - sourceId
 * - taskIndex
 */
function createList(objectForCreate, redis, callback) {
    let addListFiles = (directory) => {
        if (!Array.isArray(objectForCreate.objFilesList[directory])) {
            return Promise.resolve();
        }

        let promises = objectForCreate.objFilesList[directory].map(files => {
            redis.lpush(`task_filter_list_files:${objectForCreate.sourceId}:${objectForCreate.taskIndex}:${directory}`, files);
        });
        return Promise.all(promises);
    };

    return new Promise((resolve, reject) => {
        deleteList(objectForCreate.sourceId, objectForCreate.taskIndex, redis)
            .then((result, err) => {
                if (err) reject(err);
                else resolve();
            });
    }).then(() => {
        let arrayDir = Object.keys(objectForCreate.objFilesList);
        let promises = arrayDir.map(dir => { addListFiles(dir); });

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
    return new Promise((resolve, reject) => {
        redis.keys(`task_filter_list_files:${sourceId}:${taskIndex}:*`, (err, list) => {
            if (err) reject(err);
            else resolve(list);
        });
    }).then((list) => {
        let promises = list.map((table) => {
            redis.del(table);
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
 * удаляет из указанного списка запись о файле
 * 
 * @param objectForModify
 * - sourceId
 * - taskIndex
 * - directoryName
 * - fileName
 */
function modifyList(objectForModify, redis, callback) {
    return new Promise((resolve, reject) => {
        redis.lrem(`task_filter_list_files:${objectForModify.sourceId}:${objectForModify.taskIndex}:${objectForModify.infoProcessingFile.directoryLocation}`, [0, objectForModify.infoProcessingFile.fileName], (err, isTrue) => {
            if (err) {

                if (callback) callback(err);
                else reject(err);
            } else {
                let result = (isTrue !== 0) ? objectForModify.fileName : null;

                if (callback) callback(null, result);
                else resolve(result);
            }
        });
    });
}

/**
 * возвращает объект содержащий списки файлов, пример ( <директория>: <массив файлов> )
 * 
 * @param sourceId - идентификатор источника
 * @param taskIndex - идентификатор задачи
 */
function getList(sourceId, taskIndex, redis, callback) {
    let objFinaly = {};

    return new Promise((resolve, reject) => {
        redis.keys(`task_filter_list_files:${sourceId}:${taskIndex}:*`, (err, list) => {
            if (err) return reject(err);
            if (list.length === 0) return reject(new Error('the specified filter task ID was not found'));

            resolve(list);
        });
    }).then((list) => {
        return new Promise((resolve) => {
            let promises = list.map(key => {

                redis.lrange(key, [0, -1], (err, list) => {
                    objFinaly[key] = list;
                    resolve(list);
                });
            });
            return Promise.all(promises);
        });
    }).then(() => {
        return new Promise((resolve) => {
            process.nextTick(() => {
                if (callback) callback(null, objFinaly);
                else resolve(objFinaly);
            });
        });
    }).catch((err) => {
        return new Promise((resolve, reject) => {
            process.nextTick(() => {
                if (callback) callback(err);
                else reject(err);
            });
        });
    });
}