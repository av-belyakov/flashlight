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
 * @param {*} sourceID ID источника\
 * @param {*} cb функция обратного вызова
 */
module.exports = function(redis, sourceID, cb) {
    let objTasks = globalObject.getDataTaskDownloadFilesForSourceIP(sourceID);

    debug(objTasks);

    //'expect', 'in line'
    let objListTasks = {
        listTasksDrop: [],
        listTasksResume: []
    };

    for (let taskIndex in objTasks) {
        if (objTasks[taskIndex].status === 'loaded') {
            if (objTasks[taskIndex].uploadInfo.fileSelectionType === 'chose files') {
                objListTasks.listTasksDrop.push(taskIndex);
            } else {
                objListTasks.listTasksResume.push(taskIndex);
            }
        } else {
            objListTasks.listTasksDrop.push(taskIndex);
        }
    }

    debug('после обработки раскидываем задачи на те которые нужно продолжать и на те которые можно снять ');

    async.parallel([
        //задачи которые можно снять с выполнения
        callback => {

        },
        //задачи которые будут ожидать возобновления соединения
        callback => {

        }
    ], err => {
        if (err) cb(err);
        else cb(null);
    });
};