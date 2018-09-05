/*
 * Модуль вызываемый при неудачном приеме загружаемого файла 
 *
 * Версия 0.4, дата релиза 05.09.2018
 * */

'use strict';

const globalObject = require('../../configure/globalObject');

/**
 * 
 * @param {*} redis дискриптор соединения с БД
 * @param {*} taskIndex идентификатор задачи
 * @param {*} cb функция обратного вызова
 */
module.exports = function(redis, taskIndex, cb) {
    //увеличиваем на единицу количество загруженных с ошибками файлов
    globalObject.incrementNumberFiles(taskIndex, 'numberFilesUploadedError');

    let obj = globalObject.getData('processingTasks', taskIndex);

    redis.hset(`task_filtering_all_information:${taskIndex}`,
        'countFilesLoadedError', obj.uploadInfo.numberFilesUploadedError,
        err => {
            if (err) cb(err);
            else cb(null);
        });
};