/*
 * Проверка очереди на выгрузку файлов (таблица task_turn_downloading_files)
 * запуск новой задачи на выгрузку файлов если данная задача находится в очереди
 *
 * Версия 0.1, дата релиза 20.09.2016
 * */

'use strict';

const globalObject = require('../../configure/globalObject');
const downloadManagementFiles = require('./downloadManagementFiles');

module.exports = function(redis, taskIndex, sourceID, callback) {
    new Promise((resolve, reject) => {
        redis.exists('task_turn_downloading_files', (err, result) => {
            if (err) reject(err);
            else resolve(result === 0);
        });
    }).then(isExist => {
        return new Promise((resolve, reject) => {
            if (isExist) return resolve([]);

            //проверяем таблицу с очередью
            redis.lrange('task_turn_downloading_files', [0, -1], (err, arrayTurn) => {
                if (err) reject(err);
                else resolve(arrayTurn);
            });
        });
    }).then(listTurnDownloadFiles => {
        if (listTurnDownloadFiles.length === 0) return [];

        let arraySourceIdTurnIsExists = listTurnDownloadFiles.filter(item => item.split(':')[0] === sourceID);

        return arraySourceIdTurnIsExists;
    }).then(arraySourceIdTurnIsExists => {
        return new Promise((resolve, reject) => {
            if (arraySourceIdTurnIsExists.length === 0) return callback(null, {});

            //проверяем таблицу выполняющихся задач
            redis.lrange('task_implementation_downloading_files', [0, -1], (err, arrayImplementation) => {
                if (err) reject(err);
                else resolve({
                    listImplementation: arrayImplementation,
                    listSourceTurn: arraySourceIdTurnIsExists
                });
            });
        });
    }).then(({ listImplementation, listSourceTurn }) => {
        let arraySourceIdImplementationIsExists = listImplementation.filter(item => item.split(':')[0] === sourceID);

        if (arraySourceIdImplementationIsExists.length === 0) {
            for (let i = 0; i < listSourceTurn.length; i++) {
                if (~listSourceTurn[i].indexOf(':')) {
                    let [sid, taskID] = listSourceTurn[i].split(':');

                    if (sid === sourceID) {
                        let taskInfo = globalObject.getData('processingTasks', taskID);

                        if (typeof taskInfo === 'undefined') return;

                        return downloadManagementFiles.startRequestDownloadFiles(redis, {
                            sourceID: sourceID,
                            taskIndex: taskID,
                            listFiles: taskInfo.uploadInfo.listFiles
                        });
                    }
                }
            }
        }

        return;
    }).then(() => {
        callback(null);
    }).catch(err => {
        callback(err);
    });
};