/*
 * Проверка очереди на выгрузку файлов (таблица task_turn_downloading_files)
 * запуск новой задачи на выгрузку файлов если данная задача находится в очереди
 *
 * Версия 0.1, дата релиза 20.09.2016
 * */

'use strict';

const debug = require('debug')('checkQueueTaskDownloadFiles');

const async = require('async');

const errorsType = require('../../errors/errorsType');
const globalObject = require('../../configure/globalObject');
const downloadManagementFiles = require('./downloadManagementFiles');

module.exports = function(redis, taskIndex, sourceID, callback) {
    new Promise((resolve, reject) => {

        debug('...START function checkQueueTaskDownloadFiles');

        redis.exists('task_turn_downloading_files', (err, result) => {
            if (err) reject(err);
            else resolve(result === 0);
        });
    }).then(isExist => {

        debug(`table "task_turn_downloading_files" is exist: ${isExist}`);

        return new Promise((resolve, reject) => {
            if (isExist) return resolve([]);

            //проверяем таблицу с очередью
            redis.lrange('task_turn_downloading_files', [0, -1], (err, arrayTurn) => {
                if (err) reject(err);
                else resolve(arrayTurn);
            });
        });
    }).then(listTurnDownloadFiles => {

        debug('list ALL task turn download files');
        debug(listTurnDownloadFiles);

        if (listTurnDownloadFiles.length === 0) return [];

        let arraySourceIdTurnIsExists = listTurnDownloadFiles.filter(item => item.split(':')[0] === sourceID);

        return arraySourceIdTurnIsExists;
    }).then(arraySourceIdTurnIsExists => {
        return new Promise((resolve, reject) => {

            debug('list task turn download files is current sources');
            debug(arraySourceIdTurnIsExists);

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

        debug('listImplementation');
        debug(listImplementation);
        debug('liastSourceTurn');
        debug(listSourceTurn);

        let arraySourceIdImplementationIsExists = listImplementation.filter(item => item.split(':')[0] === sourceID);

        debug(`count current source implementation ${arraySourceIdImplementationIsExists.length}`);

        if (arraySourceIdImplementationIsExists.length === 0) {
            for (let i = 0; i < listSourceTurn.length; i++) {

                debug(listSourceTurn[i]);

                if (~listSourceTurn[i].indexOf(':')) {
                    let [sid, taskID] = listSourceTurn[i].split(':');

                    debug(sid + ' ---- ' + taskID);
                    debug(`sid === sourceID (${sid === sourceID})`);

                    if (sid === sourceID) {
                        let taskInfo = globalObject.getData('processingTasks', taskID);

                        if (typeof taskInfo === 'undefined') return;

                        debug('---------------------------------------------------');
                        debug(`------ taskIndex ${taskID} ---------`);
                        debug(taskInfo);

                        return downloadManagementFiles.startRequestDownloadFiles(redis, {
                            sourceID: sourceID,
                            taskIndex: taskID,
                            listFiles: taskInfo.uploadInfo.listFiles
                        });
                    }
                }
            }

            /*startNewTaskDownloadFiles(redis, listSourceTurn[0], (err, objTaskIndex) => {
                if (err) throw (err);

                debug('after function startNewTaskDownloadFiles');
                debug(objTaskIndex);

                callback(null, objTaskIndex);
            });*/
        }

        return;
    }).then(() => {
        callback(null);
    }).catch(err => {
        callback(err);
    });
};

//запуск новой задачи по выгузке файлов
function startNewTaskDownloadFiles(redis, taskIndexHash, func) {

    debug('...START function startNewTaskDownloadFiles');
    debug(taskIndexHash);

    if (!(~taskIndexHash.indexOf(':'))) return func(new errorsType.errorRedisDataBase('Внутренняя ошибка сервера', ''));

    let taskIndex = taskIndexHash.split(':')[1];

    async.series([
        //изменяем время начала загрузки файлов, таблица task_filtering_all_information:*
        callback => {
            redis.hset(`task_filtering_all_information:${taskIndex}`, 'dateTimeStartUploadFiles', +new Date(), err => {
                if (err) callback(err);
                else callback(null);
            });
        },
        //удаляем задачу из таблице task_turn_downloading_files
        callback => {
            redis.lrem('task_turn_downloading_files', 0, taskIndexHash, err => {
                if (err) callback(err);
                else callback(null);
            });
        },
        //добавляем задачу в таблицу task_implementation_downloading_files
        callback => {
            redis.rpush('task_implementation_downloading_files', taskIndexHash, err => {
                if (err) callback(err);
                else callback(null);
            });
        }
    ], err => {
        if (err) return func(err);

        //получаем необходимую информацию для формирования запроса о начале загрузки файлов
        redis.hmget(`task_filtering_all_information:${taskIndex}`,
            'countFilesFound',
            'directoryFiltering',
            (err, result) => {
                if (err) func(err);
                else func(null, {
                    'messageType': 'download files',
                    'processing': 'start',
                    'taskIndex': taskIndex,
                    'countFilesFound': result[0],
                    'directoryFiltering': result[1]
                });
            });
    });
}