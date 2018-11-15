/**
 * Модуль отправляет информацию в UI при изменении статуса выполнения
 * задачи по выгрузки файлов
 * 
 * Версия 0.1, дата релиза 01.11.2018
 */

'use strict';

const getListsTaskProcessing = require('../getListsTaskProcessing');
const getTaskStatusForJobLogPage = require('../getTaskStatusForJobLogPage');

/**
 * @param {*} redis дискриптор соединения с БД
 * @param {*} taskIndex ID задачи
 * @param {*} socketIo дискриптор соединения с UI через websocket
 * @param {*} cb функция обратного вызова
 */
module.exports = function(redis, taskIndex, socketIo, cb) {
    getTaskStatusForJobLogPage(redis, taskIndex, 'uploadFiles', (err, objTaskStatus) => {
        if (err) return cb(err);

        socketIo.emit('change object status', {
            processingType: 'showChangeObject',
            informationPageJobLog: objTaskStatus,
            informationPageAdmin: getListsTaskProcessing()
        });

        cb(null);
    });
};