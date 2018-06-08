/*
 * Обработка процесса фильтрации на выбранном сенсоре
 *
 * Версия 0.1, дата релиза 06.05.2016
 * */

'use strict';

const controllers = require('../../controllers');

module.exports.execute = function(taskIndex, callback) {
    const redis = controllers.connectRedis();

    redis.hmget('task_filtering_all_information:' + taskIndex,
        'sourceId',
        'jobStatus',
        'countCycleComplete',
        'countFilesFiltering',
        'countFilesProcessed',
        'countFilesFound',
        function(err, result) {
            if (err) callback(err);
            else callback(null, {
                taskIndex: taskIndex,
                sourceId: result[0],
                jobStatus: result[1],
                countCycleComplete: result[2],
                countFilesFiltering: result[3],
                countFilesProcessed: result[4],
                countFilesFound: result[5]
            });
        });
};