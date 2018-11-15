/**
 * Модуль обрабатывающий останов процессов фильтрации при
 * разрыве соединения с определенным источником
 * 
 * Версия 0.1, дата релиза 15.11.2018
 */

'use strict';

const async = require('async');

const globalObject = require('../../configure/globalObject');
const getTaskStatusForJobLogPage = require('../getTaskStatusForJobLogPage');

/**
 * @param {*} redis дискриптор соединения с БД
 * @param {*} sourceID ID источника
 * @param {*} socketIo дискриптор соединения с UI
 */
module.exports = function(redis, sourceID, socketIo) {
    return new Promise((resolve, reject) => {
        let objTasks = globalObject.getDataTaskFilterFilesForSourceIP(sourceID);

        let listTasks = Object.keys(objTasks).filter(taskID => {
            if (typeof objTasks[taskID].status === 'undefined' || objTasks[taskID].status === null) return false;
            if (objTasks[taskID].status !== 'execute') return false;

            globalObject.modifyData('processingType', taskID, [
                ['status', 'expect']
            ]);
            return true;
        });

        async.each(listTasks, (taskID, callbackEach) => {
            async.parallel([
                callbackParallel => {
                    redis.hset(`task_filtering_all_information:${taskID}`, 'jobStatus', 'expect', err => {
                        if (err) callbackParallel(err);
                        else callbackParallel(null);
                    });
                },
                callbackParallel => {
                    getTaskStatusForJobLogPage(redis, taskID, 'jobStatus', (err, objTaskStatus) => {
                        if (err) return callbackParallel(err);

                        socketIo.emit('change object status', {
                            processingType: 'showChangeObject',
                            informationPageJobLog: objTaskStatus,
                            informationPageAdmin: listTasks
                        });

                        callbackParallel(null);
                    });
                }
            ], err => {
                if (err) callbackEach(err);
                else callbackEach(null);
            });
        }, err => {
            if (err) return reject(err);

            //генерируем событие удаляющее виджет визуализирующий загрузку файла
            listTasks.forEach(item => {
                let objFileInfo = {
                    'information': {
                        'taskIndex': item
                    }
                };

                socketIo.emit('filtering stop', objFileInfo);
            });

            resolve();
        });
    });
};