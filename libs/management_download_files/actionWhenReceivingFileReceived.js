/*
 * Модуль вызываемый при удачном приеме загружаемого файла
 * 
 * Версия 0.3, дата релиза 05.09.2018
 * */

'use strict';

const globalObject = require('../../configure/globalObject');

/**
 * 
 * @param {*} redis дискриптор соединения с БД
 * @param {*} taskIndex идентификатор задачи
 * @param {*} sourceID идентификатор источника
 * @param {*} cb функция обратного вызова
 */
module.exports = function(redis, taskIndex, sourceID, cb) {
    let infoDownloadFile = globalObject.getData('downloadFilesTmp', sourceID);

    new Promise((resolve, reject) => {
        redis.hget(`task_list_files_found_during_filtering:${sourceID}:${taskIndex}`, infoDownloadFile.fileName, (err, result) => {
            if (err) reject(err);
            else resolve(result);
        });
    }).then(fileInfo => {
        try {
            let fi = JSON.parse(fileInfo);

            fi.fileDownloaded = true;

            return JSON.stringify(fi);
        } catch (err) {
            throw err;
        }
    }).then(fi => {
        return new Promise((resolve, reject) => {
            redis.hset(`task_list_files_found_during_filtering:${sourceID}:${taskIndex}`, infoDownloadFile.fileName, fi, err => {
                if (err) reject(err);
                else resolve();
            });
        });
    }).then(() => {
        cb(null);
    }).catch(err => {
        cb(err);
    });
};