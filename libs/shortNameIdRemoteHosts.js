/*
* Возвращает объект содержащий идентификатор удаленного хоста и его краткое имя
*
* Версия 0.1, 26.02.2016
* */

'use strict';

const async = require('async');

const writeLogFile = require('./writeLogFile');

/*
* принимает следующие параметры:
* - линк соединения с БД
* - функцию обратного вызова
* */
module.exports.getShortNameForIdRemoteHosts = function (redis, func) {
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
            let obj = {};

            if(arrayId.length === 0) return callback(null, obj);

            async.map(arrayId, function (item, callbackMap){
                redis.hget('remote_host:settings:' + item, 'shortName', function (err, name) {
                    if(err) return callbackMap(err);

                    obj[item] = name;
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