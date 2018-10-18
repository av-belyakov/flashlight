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
    }).then(() => {
        //получаем имя загружаемого файла
        let fileName = globalObject.getData('downloadFilesTmp', sourceID).fileName;
        let sourceIP = globalObject.getData('sources', sourceID).ipaddress;

        debug('получаем имя загружаемого файла');
        debug(fileName);
        debug('получаем IP источника');
        debug(sourceIP);

        return { 'fileName': fileName, 'sourceIP': sourceIP };
    }).then(({ fileName, sourceIP }) => {
        let wsl = globalObject.getData('writeStreamLinks', `writeStreamLink_${sourceIP}_${fileName}`);
        if ((wsl === null) || (typeof wsl === 'undefined')) {
            throw (new Error('not found a stream for writing to a file'));
        }

        debug('закрываем дискриптор потока на запись в файл');

        //закрываем дискриптор потока на запись в файл
        wsl.end();

        let fileTmp = `/${config.get('downloadDirectoryTmp:directoryName')}/uploading_with_${sourceIP}_${fileName}.tmp`;

        return fileTmp;
    }).then(fileTmp => {
        return new Promise((resolve, reject) => {
            debug('удаляем временный файл');

            //удаляем временный файл
            fs.unlink(fileTmp, err => {
                if (err) reject(err);
                else resolve();
            });
        });
    });
};