/*
 * Проверка существования идентификатора в таблице task_implementation_downloading_files
 * таблица выполняемых задач на выгрузку сет. трафика
 *
 * Версия 0.1, дата релиза 22.08.2016
 * */

'use strict';

module.exports = function(redis, sourceId, func) {
    redis.lrange('task_implementation_downloading_files', [0, -1], function(err, list) {
        if (err) return func(err);

        let isTrue = list.some((item) => {
            if (!(~item.indexOf(':'))) return false;

            return (sourceId === item.split(':')[0]);
        });

        func(null, isTrue);
    });
};