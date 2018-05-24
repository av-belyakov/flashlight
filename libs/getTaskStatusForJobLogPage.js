/*
 * Готовит объект с информацией о статусе задачи
 *
 * Версия 0.1, дата релиза 13.10.2016
 * */

'use strict';

const writeLogFile = require('./writeLogFile');

module.exports = function(redis, taskIndex, typeElement, func) {
    redis.hget('task_filtering_all_information:' + taskIndex, typeElement, (err, newStatus) => {
        if (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            func(err);
        } else {
            func(null, {
                'typeElement': typeElement,
                'idElement': taskIndex,
                'newStatus': newStatus
            });
        }
    });
};