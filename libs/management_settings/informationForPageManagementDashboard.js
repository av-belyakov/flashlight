/*
 * Подготовка информации для вывода на странице settings_dashboard
 *
 * Версия 0.1, дата релиза 22.03.2016
 * */

'use strict';

const async = require('async');

const writeLogFile = require('../../libs/writeLogFile');

/* получить краткую информацию об всех источниках
 * на вход принимает следующие параметры
 * - redis линк соединения с БД
 * - req объект запроса
 * - func функцию обратного вызова
 */
exports.getShortInformationForTable = function (redis, req, func) {
    async.waterfall([
        /* получаем список идентификаторов удаленных хостов */
        function (callback) {
            redis.lrange('remote_hosts_exist:id', [0, -1],function (err, items) {
                if(err) callback(err);
                else callback(null, items);
            });
        },
        /* формирует объект с краткой информацией по удаленным хостам */
        function (arrayId, callback) {
            var obj = {};

            if(arrayId.length === 0) return callback(null, obj);

            async.map(arrayId ,function (item, callbackMap) {
                redis.hmget('remote_host:settings:' + item,
                    'shortName',
                    'detailedDescription', function (err, arrData) {
                        if(err) return callbackMap(err);

                        obj[item] = {
                            'shortName' : arrData[0],
                            'detailedDescription' : arrData[1]
                        };
                        callbackMap(null, obj);
                    });
            }, function (err, arrayResult) {
                if(err) callback(err);
                else callback(null, arrayResult[0]);
            });
        }
    ], function (err, result) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());
        func(result);
    });
};
