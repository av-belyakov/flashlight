/**
 * Модуль выполняет обработку задач по скачиванию файлов с выбранного источника
 * при РАЗРЫВЕ соединения websocket
 * 
 * Версия 0.1, дата релиза 30.10.2018
 */

'use strict';

const async = require('async');

const globalObject = require('../../configure/globalObject');
const sendMsgTaskDownloadChangeObjectStatus = require('../helpers/sendMsgTaskDownloadChangeObjectStatus');

/**
 * @param {*} redis дискриптор соединения с БД
 * @param {*} sourceID ID источника
 * @param {*} socketIo дискриптор соединения с UI
 */
module.exports = function(redis, sourceID, socketIo) {
    return new Promise((resolve, reject) => {
        let objTasks = globalObject.getDataTaskDownloadFilesForSourceIP(sourceID);

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

        async.parallel([
            //задачи которые можно снять с выполнения
            callback => {
                async.each(objListTasks.listTasksDrop, (item, callbackEach) => {
                    redis.hset(`task_filtering_all_information:${item.taskIndex}`, 'uploadFiles', item.status, err => {
                        if (err) callbackEach(err);
                        else callbackEach(null);
                    });
                }, (err) => {
                    if (err) return callback(err);

                    //удаляем задачи из globalObject
                    objListTasks.listTasksDrop.forEach(task => {
                        globalObject.deleteData('processingTasks', task.taskIndex);
                    });

                    callback(null);
                });
            },
            //задачи которые будут ожидать возобновления соединения
            callback => {
                async.each(objListTasks.listTasksResume, (item, callbackEach) => {
                    async.parallel([
                        cb => {
                            redis.hset(`task_filtering_all_information:${item.taskIndex}`, 'uploadFiles', item.status, err => {
                                if (err) cb(err);
                                else cb(null);
                            });
                        },
                        cb => {
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

                    //модифицируем значения
                    objListTasks.listTasksResume.forEach(task => {
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

            resolve(objListTasks);
        });
    }).then(objListTasks => {
        return new Promise((resolve, reject) => {
            let arrTaskIndex = [];
            for (let key in objListTasks) {
                objListTasks[key].forEach(item => {
                    if (typeof item.taskIndex !== 'undefined') {
                        arrTaskIndex.push(item.taskIndex);
                    }
                });
            }

            //генерируем событие удаляющее виджет визуализирующий загрузку файла
            arrTaskIndex.forEach(item => {
                let objFileInfo = {
                    'information': {
                        'taskIndex': item
                    }
                };

                socketIo.emit('task upload files cancel', objFileInfo);
            });

            async.each(arrTaskIndex, (item, callbackEach) => {
                //изменяем состояние задачи на странице управления задачами
                sendMsgTaskDownloadChangeObjectStatus(redis, item, socketIo, err => {
                    if (err) callbackEach(err);
                    else callbackEach(null);
                });
            }, err => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
};