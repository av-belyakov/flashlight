/*
* Получаем идентификатор источника по хешу для таблицы task_filtering_all_information:*
*
* Версия 0.1, дата релиза 24.08.2016
* */

'use strict';

module.exports = function (redis, hex, func) {
    redis.hget('task_filtering_all_information:' + hex, 'sourceId', function (err, id) {
        if(err) func(err);
        else func(null, id);
    });
};