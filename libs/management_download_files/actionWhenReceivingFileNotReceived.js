/*
 * Модуль вызываемый при неудачном приеме загружаемого файла 
 *
 * Версия 0.3, дата релиза 30.08.2018
 * */

'use strict';

module.exports = function(redis, taskIndex, cb) {
    redis.hget(`task_filtering_all_information:${taskIndex}`,
        'countFilesLoadedError',
        (err, countFilesLoadedError) => {
            if (err) return cb(err);

            redis.hset(`task_filtering_all_information:${taskIndex}`,
                'countFilesLoadedError',
                ++countFilesLoadedError,
                err => {
                    if (err) cb(err);
                    else cb(null);
                });
        });
};