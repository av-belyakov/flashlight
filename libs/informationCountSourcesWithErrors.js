/*
* Информация о количестве источников с ошибками
*
* Версия 0.1, дата релиза 28.06.2016*
* */

'use strict';

const async = require('async');

const writeLogFile = require('./writeLogFile');

module.exports = function (redis, func) {
    async.waterfall([
        function (callback) {
            redis.lrange('remote_hosts_exist:id', [0, -1], function (err, arrayListError) {
                if(err) callback(err);
                else callback(null, arrayListError);
            });
        },
        function (arrayListError, callback) {
            let obj = { allCountSources : arrayListError.length };
            let arrayTmp = [];

            async.eachOf(arrayListError, function (sourceId, key, callbackEachOf) {
                redis.exists('remote_host:errors:' + sourceId, function (err, isTrue) {
                    if(err) return callbackEachOf(err);

                    if(isTrue === 1) arrayTmp.push(sourceId);
                    callbackEachOf(null);
                });
            }, function (err) {
                if(err){
                    callback(err);
                } else {
                    obj.errorCountSources = arrayTmp.length;
                    callback(null, obj);
                }
            });
        }
    ], function (err, resultObj) {
        if(err){
            writeLogFile.writeLog('\tError: ' + err.toString());
            func({});
        } else {
            func(resultObj);
        }
    });
};