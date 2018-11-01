/**
 * Модуль отправляет информацию в UI при изменении статуса выполнения
 * задачи по выгрузки файлов
 * 
 * Версия 0.1, дата релиза 01.11.2018
 */

'use strict';

const getListsTaskProcessing = require('../getListsTaskProcessing');
const getTaskStatusForJobLogPage = require('../getTaskStatusForJobLogPage');

module.exports = function(redis, taskIndex, socketIo, cb) {
    //сообщения об изменении статуса задач
    new Promise((resolve, reject) => {
        getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', (err, objTaskStatus) => {
            if (err) reject(err);
            else resolve(objTaskStatus);
        });
    }).then(objTaskStatus => {
        return new Promise((resolve, reject) => {
            getListsTaskProcessing((err, objListsTaskProcessing) => {
                if (err) reject(err);
                else resolve({
                    status: objTaskStatus,
                    lists: objListsTaskProcessing
                });
            });
        });
    }).then(obj => {
        socketIo.emit('change object status', {
            processingType: 'showChangeObject',
            informationPageJobLog: obj.status,
            informationPageAdmin: obj.lists
        });

        cb(null);
    }).catch(err => {
        cb(err);
    });
};