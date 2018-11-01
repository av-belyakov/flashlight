/**
 * Модуль выполняет обработку задач по скачиванию файлов с выбранного источника
 * при РАЗРЫВЕ соединения websocket
 * 
 * Версия 0.1, дата релиза 30.10.2018
 */

'use strict';

const debug = require('debug')('processingDownloadFilesConnectionClosed');

const async = require('async');

const globalObject = require('../../configure/globalObject');

/**
 * @param {*} redis дискриптор соединения с БД
 * @param {*} sourceID ID источника
 * @param {*} cb функция обратного вызова
 */
module.exports = function(redis, sourceID) {
    return new Promise((resolve, reject) => {
        let objTasks = globalObject.getDataTaskDownloadFilesForSourceIP(sourceID);

        debug(objTasks);

        let objListTasks = {
            listTasksDrop: [],
            listTasksResume: []
        };

        for (let taskIndex in objTasks) {
            let statusUploadFile = (objTasks[taskIndex].uploadInfo.numberPreviouslyDownloadedFiles > 0) ? 'partially loaded' : 'not loaded';
            let objTaskInfo = {
                'taskIndex': taskIndex,
                'status': statusUploadFile,
                'sourceID': objTasks[taskIndex].sourceId
            };

            if (objTasks[taskIndex].status === 'loaded') {
                if (objTasks[taskIndex].uploadInfo.fileSelectionType === 'chose files') {
                    objListTasks.listTasksDrop.push(objTaskInfo);
                } else {
                    objTaskInfo.status = 'in line';
                    objListTasks.listTasksResume.push(objTaskInfo);
                }
            } else {
                objListTasks.listTasksDrop.push(objTaskInfo);
            }
        }

        debug('после обработки раскидываем задачи на те которые нужно продолжать и на те которые можно снять ');

        async.parallel([
            //задачи которые можно снять с выполнения
            callback => {

                debug('запуск async.each для снятых задач');

                async.each(objListTasks.listTasksDrop, (item, callbackEach) => {

                    debug('task ID = ' + item.taskIndex);

                    redis.hset(`task_filtering_all_information:${item.taskIndex}`, 'uploadFiles', item.status, err => {
                        if (err) callbackEach(err);
                        else callbackEach(null);
                    });
                }, (err) => {
                    if (err) return callback(err);

                    debug('удаляем задачи из globalObject');

                    //удаляем задачи из globalObject
                    objListTasks.listTasksDrop.forEach(task => {
                        globalObject.deleteData('processingTasks', task.taskIndex);
                    });

                    callback(null);
                });
            },
            //задачи которые будут ожидать возобновления соединения
            callback => {

                debug('задачи которые будут ожидать возобновления соединения');

                async.each(objListTasks.listTasksResume, (item, callbackEach) => {

                    debug('task ID = ' + item.taskIndex);

                    async.parallel([
                        cb => {

                            debug('change task_filtering_all_information: "iploadFiles" to "in line"');

                            redis.hset(`task_filtering_all_information:${item.taskIndex}`, 'uploadFiles', item.status, err => {
                                if (err) cb(err);
                                else cb(null);
                            });
                        },
                        cb => {

                            debug('add task in task_turn_downloading_files');

                            redis.lpush('task_turn_downloading_files', `${item.sourceID}:${item.taskIndex}`, err => {
                                if (err) cb(err);
                                else cb(null);
                            });
                        }
                    ], err => {
                        if (err) callbackEach(err);
                        else callbackEach(null);
                    });
                }, (err) => {
                    if (err) return callback(err);

                    debug('модифицируем значения globalObject');

                    //модифицируем значения
                    objListTasks.listTasksResume.forEach(task => {

                        debug(task);

                        globalObject.modifyData('processingTasks', task.taskIndex, [
                            ['status', 'in line'],
                            ['timestampModify', +new Date()]
                        ]);
                    });

                    callback(null);
                });
            }
        ], err => {
            if (err) return reject(err);

            debug('FINALY');
            debug(globalObject.getDataTaskDownloadFilesForSourceIP(sourceID));

            resolve(objListTasks);
        });
    });
};