/*
 * Модуль вызываемый при удачном приеме загружаемого файла
 * 
 * Версия 0.4, дата релиза 17.10.2018
 * */

'use strict';

const writeLogFile = require('../../libs/writeLogFile');
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

            if (!fi.fileDownloaded) {
                //увеличиваем на единицу количество загруженных файлов
                globalObject.incrementNumberFiles(taskIndex, 'numberFilesUploaded');
                fi.fileDownloaded = true;

                return JSON.stringify(fi);
            }

            return null;
        } catch (err) {
            throw err;
        }
    }).then(fi => {
        if (fi === null) return;

        return new Promise((resolve, reject) => {
            redis.hset(`task_list_files_found_during_filtering:${sourceID}:${taskIndex}`,
                infoDownloadFile.fileName,
                fi,
                err => {
                    if (err) reject(err);
                    else resolve();
                });
        });
    }).then(() => {
        let obj = globalObject.getData('processingTasks', taskIndex);

        return new Promise((resolve, reject) => {
            redis.hset(`task_filtering_all_information:${taskIndex}`,
                'countFilesLoaded',
                (obj.uploadInfo.numberFilesUploaded + obj.uploadInfo.numberPreviouslyDownloadedFiles) - obj.uploadInfo.numberFilesUploadedError,
                err => {
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