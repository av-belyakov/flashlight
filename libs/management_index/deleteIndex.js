/*
* Удаляет индексы из таблиц
*  - 'index_filter_settings_date_time',
*  - 'index_filter_settings_src_ip',
*  - 'index_filter_settings_networks'
*
*  Версия 0.1, дата релиза 06.10.2016
* */

'use strict';

const async = require('async');

module.exports = function (redis, taskIndex, done) {
    let arrayTablesIndex = [
        'index_filter_settings_date_time',
        'index_filter_settings_src_ip',
        'index_filter_settings_networks'
    ];

    async.forEachOf(arrayTablesIndex, function (value, key, feedback) {
        deleteIndex(value, function (err) {
            if(err) feedback(err);
            else feedback(err);
        });
    }, function (err) {
        if(err) done(err);
        else done();
    });

    function deleteIndex (tableName, func) {
        async.waterfall([
            function (callback) {
                redis.zrange(tableName, [ 0, -1 ], function (err, arrayIndex) {
                    if(err) callback(err);
                    else callback(null, arrayIndex);
                });
            }, function (arrayIndex, callback) {
                async.forEachOf(arrayIndex, function (value, key, recall) {
                    if(~value.indexOf(' ')){
                        let arrayIndexString = value.split(' ');
                        for(let i = 0; i < arrayIndexString.length; i++){
                            if((~arrayIndexString[i].indexOf(':')) && arrayIndexString[i].split(':')[1] === taskIndex){
                                arrayIndexString.splice(i, 1);
                                redis.zrem(tableName, value, function (err) {
                                    if(err){
                                        return recall(err);
                                    } else {
                                        redis.zadd(tableName, arrayIndexString[0].split(':')[0], arrayIndexString.join(' '), function (err) {
                                            if(err) return recall(err);
                                        });
                                    }
                                });
                            }
                        }
                        recall();
                    } else {
                        if((~value.indexOf(':')) && value.split(':')[1] === taskIndex){
                            redis.zrem(tableName, value, function (err) {
                                if(err) return recall(err);
                            });
                        }
                        recall();
                    }
                }, function (err) {
                    if(err) callback(err);
                    else callback(null, true);
                });
            }
        ], function (err) {
            if(err) func(err);
            else func();
        });
    }
};