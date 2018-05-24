/*
* Создание индекса по дате и времени.
* Создается таблица 'index_filter_settings_date_time'
*
* Версия 0.1, дата релиза 05.10.2016
* */

'use strict';

const async = require('async');

module.exports = function (func) {
    let self  = this;
    let redis = this.redis;

    let [ dateString, timeString ] = this.objFilterSettings.dateTimeStart.split(' ');
    let [ day, month, year ] = dateString.split('.');
    let dateTimeStart = +new Date(year + '.' + month + '.' + day + ' ' + timeString);

    async.waterfall([
        function (callback) {
            redis.exists('index_filter_settings_date_time', function (err, result) {
                if(err){
                    callback(err);
                } else {
                    //если таблица index_filter_settings_date_time не существует
                    if(result === 0) callback(null, false);
                    else callback(null, true);
                }
            });
        },
        function (tableIsExist, callback) {
            if(tableIsExist){
                //если таблица существует
                redis.zrangebyscore('index_filter_settings_date_time', [ dateTimeStart, dateTimeStart ], function (err, stringIndex) {
                    if(err) return callback(err);

                    if(stringIndex.length === 0) {
                        redis.zadd('index_filter_settings_date_time', dateTimeStart, dateTimeStart + ':' + self.taskIndex, function (err) {
                            if(err) callback(err);
                            else callback(null, true);
                        });
                    } else {
                        if (~stringIndex[0].indexOf(' ')) {
                            let arrayTaskIndex = stringIndex[0].split(' ');
                            let taskIndexIsExist = arrayTaskIndex.some((item) => item.split(':')[1] === self.taskIndex);
                            if(taskIndexIsExist) return callback(null, true);
                        } else {
                            if(stringIndex[0].split(':')[1] === self.taskIndex) return callback(null, true);
                        }

                        redis.zremrangebyscore('index_filter_settings_date_time', [ dateTimeStart, dateTimeStart ], function (err) {
                            if(err) return callback(err);

                            let newStringIndex = '';
                            if(~stringIndex[0].indexOf(' ')) {
                                let arrayTaskIndex = stringIndex[0].split(' ');
                                arrayTaskIndex.push(dateTimeStart + ':' + self.taskIndex);
                                newStringIndex = arrayTaskIndex.join(' ');
                            } else {
                                newStringIndex = stringIndex[0] + ' ' + dateTimeStart + ':' + self.taskIndex;
                            }
                            redis.zadd('index_filter_settings_date_time', dateTimeStart, newStringIndex, function (err) {
                                if(err) callback(err);
                                else callback(null, true);
                            });
                        });
                    }
                });
            } else {
                //если нет
                redis.zadd('index_filter_settings_date_time', dateTimeStart, dateTimeStart + ':' + self.taskIndex, function (err) {
                    if(err) callback(err);
                    else callback(null, true);
                });
            }
        }
    ], function (err) {
        if(err) func(err);
        else func(null, true);
    });
};