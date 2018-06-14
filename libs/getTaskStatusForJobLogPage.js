/*
 * Готовит объект с информацией о статусе задачи
 *
 * Версия 0.11, дата релиза 14.06.2018
 * */

'use strict';

module.exports = function(redis, taskIndex, typeElement, callback) {
    redis.hget('task_filtering_all_information:' + taskIndex, typeElement, (err, newStatus) => {
        if (err) callback(err);
        else callback(null, {
            'typeElement': typeElement,
            'idElement': taskIndex,
            'newStatus': newStatus
        });
    });
};