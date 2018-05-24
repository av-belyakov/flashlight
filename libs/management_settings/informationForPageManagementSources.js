/*
* Подготовка информации для вывода на странице settings_sources
*
* Версия 0.1, дата релиза 25.02.2016
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
            var num = 0;

            if(arrayId.length === 0) return callback(null, obj);

            arrayId.forEach(function (item) {
                redis.hmget('remote_host:settings:' + item,
                    'shortName',
                    'dateCreate',
                    'dateChanges',
                    'dateLastConnected',
                    'numberConnectionAttempts', function (err, arrData) {
                        if(err) return callback(err);
                        obj[item] = {
                            'shortName' : arrData[0],
                            'dateCreate' : arrData[1],
                            'dateChanges' : arrData[2],
                            'dateLastConnected' : arrData[3],
                            'numberConnectionAttempts' : arrData[4]
                        };
                        if((arrayId.length - 1) == num) callback(null, obj);
                        num++;
                    });
            });
        }
    ], function (err, result) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());
        func(result);
    });
};