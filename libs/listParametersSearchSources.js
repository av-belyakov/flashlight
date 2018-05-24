/*
 * Для журнала поиска ошибок,
 * формирование объекта состящего из списка источников
 *
 * Версия 0.1, дата релиза 10.06.2016
 * */

'use strict';

const async = require('async');

const writeLogFile = require('./writeLogFile');

module.exports = function (redis, func) {
    async.waterfall([
        function (callback) {
            redis.lrange('remote_hosts_exist:id', [ 0, -1 ], function (err, arrayList) {
                if(err) callback(err);
                else callback(null, arrayList);
            });
        },
        function (arrayList, callback) {
            let obj = {};
            async.map(arrayList, function (item, callbackMap) {
                redis.hget('remote_host:settings:' + item, 'shortName', function (err, result) {
                    if(err) return callbackMap(err);

                    obj[item] = result;
                    callbackMap(null, obj);
                });
            }, function (err, arrayResult) {
                if(err) callback(err);
                else callback(null, arrayResult[0]);
            });
        }
    ], function (err, resultObj) {
        if(err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            func({});
        } else {
            func(resultObj);
        }
    });
};