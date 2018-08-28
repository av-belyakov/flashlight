/*
 * Готовит объект с информацией о статусе задачи
 *
 * Версия 0.11, дата релиза 30.07.2018
 * */

'use strict';

module.exports = function(redis, taskIndex, typeElement, callback) {
    redis.hmget(`task_filtering_all_information:${taskIndex}`,
        typeElement,
        'uploadDirectoryFiles',
        'sourceId', (err, result) => {
            if (err) callback(err);
            else callback(null, {
                'typeElement': typeElement,
                'idElement': taskIndex,
                'newStatus': result[0],
                'uploadDirectoryFiles': result[1],
                'sourceID': result[2]
            });
        });
};