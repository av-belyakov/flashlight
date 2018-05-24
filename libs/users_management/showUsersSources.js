/*
* Информация об источниках закрепленных за определенным пользователем
*
* Версия 0.1, дата релиза 22.03.2016
* */

'use strict';

const async = require('async');

const writeLogFile = require('../writeLogFile');

module.exports.getSources = function (redis, userId, func) {
    async.waterfall([
        function (callback) {
            redis.lrange('remote_hosts_exist:id', [ 0, -1 ], function (err, array) {
                if(err) callback(err);
                else callback(null, array);
            });
        },
        function (arraySourcesAll, callback) {
            redis.hget('user_authntication:' + userId, 'settings', function (err, string) {
                if(err) return callback(err);

                let obj = JSON.parse(string);
                callback(null, arraySourcesAll, obj.remoteHosts);
            });
        },
        function (arraySourcesAll, arraySourcesUser, callback) {
            var num = 0;
            var resultObj = {};
            if(arraySourcesUser.length == 0) return callback(resultObj);

            arraySourcesAll.forEach(function (item) {
                for(let i = 0; i < arraySourcesUser.length; i++){
                    if(item == arraySourcesUser[i]){
                        resultObj[item] = 'checked';
                    }
                }
                if(num === (arraySourcesAll.length - 1)) callback(null, resultObj);
                num++;
            });
        }
    ], function (err, result) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());
        func(result);
    });
};