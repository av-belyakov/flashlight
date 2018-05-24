/*
 * Создание индекса по ip адресам источникам.
 * Создается таблица 'index_filter_settings_src_ip'
 *
 * Версия 0.1, дата релиза 05.10.2016
 * */

'use strict';

const async = require('async');

const networkCalculator = require('../networkCalculator');

module.exports = function (func) {
    let self = this;
    let redis = this.redis;

    if(this.objFilterSettings.ipaddress === null) return func();

    redis.exists('index_filter_settings_src_ip', function (err, result) {
        if(err) return func(err);

        function TableIndexSrcIp (ip, taskIndex) {
            this.ip = ip;
            this.taskIndex = taskIndex;
            this.ipaddressIsWillArray = ((typeof ip === 'string') && (~ip.indexOf(','))) ? true : false;
        }

        TableIndexSrcIp.prototype.createIndex = function (feedback) {
            if(this.ipaddressIsWillArray){
                let arrayIp = this.ip.split(',');
                let self = this;

                async.forEachOf(arrayIp, function (value, key, recall) {
                    processed(value, self.taskIndex, function (err) {
                        if(err) recall(err);
                        else recall();
                    });
                }, function (err) {
                    if(err) feedback(err);
                    else feedback();
                });
            } else {
                processed(this.ip, this.taskIndex, function (err) {
                    if(err) feedback(err);
                    else feedback();
                });
            }

            function processed (ip, taskIndex, done) {
                let ipaddress = networkCalculator.IPv4_dotquadA_to_intA(ip);

                redis.zadd('index_filter_settings_src_ip', ipaddress, ipaddress + ':' + taskIndex, function (err) {
                    if(err) done(err);
                    else done(null, true);
                });
            }
        };

        TableIndexSrcIp.prototype.insertIndex = function (feedback) {
            if(this.ipaddressIsWillArray){
                let arrayIp = this.ip.split(',');
                let self = this;

                async.forEachOf(arrayIp, function (value, key, recall) {
                    processed(value, self.taskIndex, function (err) {
                        if(err) recall(err);
                        else recall();
                    });
                }, function (err) {
                    if(err) feedback(err);
                    else feedback();
                });
            } else {
                processed(this.ip, this.taskIndex, function (err) {
                    if(err) feedback(err);
                    else feedback();
                });
            }

            function processed (ip, taskIndex, done) {
                let ipaddress = networkCalculator.IPv4_dotquadA_to_intA(ip);

                redis.zrangebyscore('index_filter_settings_src_ip', [ ipaddress, ipaddress ], function (err, stringIndex) {
                    if(err) return done(err);

                    //проверяем вообще что то найдено
                    if(stringIndex.length === 0) {
                        redis.zadd('index_filter_settings_src_ip', ipaddress, ipaddress + ':' + taskIndex, function (err) {
                            if(err) done(err);
                            else done(null, true);
                        });
                    } else {
                        if(~stringIndex[0].indexOf(' ')){
                            let arrayTaskIndex = stringIndex[0].split(' ');
                            let taskIndexIsExist = arrayTaskIndex.some((item) => item.split(':')[1] === taskIndex);
                            if(taskIndexIsExist) return done(null, true);
                        } else {
                            if(stringIndex[0].split(':')[1] === taskIndex) return done(null, true);
                        }

                        redis.zremrangebyscore('index_filter_settings_src_ip', [ ipaddress, ipaddress ], function (err) {
                            if(err) return done(err);

                            let newStringIndex = '';
                            if(~stringIndex[0].indexOf(' ')) {
                                let arrayTaskIndex = stringIndex[0].split(' ');
                                arrayTaskIndex.push(ipaddress + ':' + taskIndex);
                                newStringIndex = arrayTaskIndex.join(' ');
                            } else {
                                newStringIndex = stringIndex[0] + ' ' + ipaddress + ':' + taskIndex;
                            }
                            redis.zadd('index_filter_settings_src_ip', ipaddress, newStringIndex, function (err) {
                                if(err) done(err);
                                else done(null, true);
                            });
                        });
                    }
                });
            }
        };

        let tableIndexSrcIp = new TableIndexSrcIp(self.objFilterSettings.ipaddress, self.taskIndex);
        //если таблица index_filter_settings_networks не существует
        if (result === 0) {
            tableIndexSrcIp.createIndex(function (err) {
                if(err) func(err);
                else func();
            });
        } else {
            tableIndexSrcIp.insertIndex(function (err) {
                if(err) func(err);
                else func();
            });
        }
    });
};