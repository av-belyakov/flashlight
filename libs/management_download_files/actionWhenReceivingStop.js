/*
 * Модуль выполняющий обработку сообщения об остановке задачи по передачи файлов
 *
 * Версия 0.1, дата релиза 03.10.2018
 * */

'use strict';

const debug = require('debug')('actionWhenReceivingStop');

const fs = require('fs');
const async = require('async');

const config = require('../../configure');
const globalObject = require('../../configure/globalObject');

/**
 * 
 * @param {*} redis - дескриптор соединения с БД
 * @param {*} taskIndex - ID задачи
 * @param {*} sourceID - ID источника
 */
module.exports = function(redis, { taskIndex, sourceID }) {

    debug('...START function actionWhenReceivingStop');

    return new Promise((resolve, reject) => {
        async.parallel([
            callback => {
                redis.lrem('task_implementation_downloading_files', 0, `${sourceID}:${taskIndex}`, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            },
            callback => {
                redis.hmset(`task_filtering_all_information:${taskIndex}`, {
                    'uploadFiles': 'partially loaded',
                    'dateTimeEndUploadFiles': +new Date()
                }, err => {
                    if (err) callback(err);
                    else callback(null);
                });
            }
        ], err => {
            if (err) reject(err);
            else resolve(null);
        });
    });
};