/*
 * Создание индекса по подсетям источникам.
 * Создается таблица 'index_filter_settings_network'
 *
 * Версия 0.1, дата релиза 05.10.2016
 * */

'use strict';

const async = require('async');

const networkCalculator = require('../networkCalculator');

module.exports = function (func) {
    let self = this;
    let redis = this.redis;

    if(this.objFilterSettings.network === null) return func();

    redis.exists('index_filter_settings_networks', function (err, result) {
        if(err) return func(err);

        function TableIndexNetwork (network, taskIndex) {
            this.network = network;
            this.taskIndex = taskIndex;
            this.networkIsWillArray = ((typeof network === 'string') && (~network.indexOf(','))) ? true : false;
        }

        TableIndexNetwork.prototype.createIndex = function (feedback) {
            if(this.networkIsWillArray){
                let arrayNetwork = this.network.split(',');
                let self = this;

                async.forEachOf(arrayNetwork, function (value, key, recall) {
                    processed(value, self.taskIndex, function (err) {
                        if(err) recall(err);
                        else recall();
                    });
                }, function (err, result) {
                    if(err) feedback(err);
                    else feedback();
                });
            } else {
                if(!(~this.network.indexOf('/'))) return feedback();

                processed(this.network, this.taskIndex, function (err) {
                    if(err) feedback(err);
                    else feedback();
                });
            }

            function processed (network, taskIndex, done) {
                let [ valueNetwork, valueNetworkMask ] = network.split('/');
                let ip4Address = new networkCalculator(valueNetwork, valueNetworkMask);

                async.parallel([
                    function (callback) {
                        redis.zadd('index_filter_settings_networks', ip4Address.netaddressInteger, ip4Address.netaddressInteger + ':' + taskIndex, function (err) {
                            if(err) callback(err);
                            else callback(null, true);
                        });
                    },
                    function (callback) {
                        redis.zadd('index_filter_settings_networks', ip4Address.netbcastInteger, ip4Address.netbcastInteger + ':' + taskIndex, function (err) {
                            if(err) callback(err);
                            else callback(null, true);
                        });
                    }
                ], function (err) {
                    if(err) done(err);
                    else done(null, true);
                });
            }
        };

        TableIndexNetwork.prototype.insertIndex = function (feedback) {
            if(this.networkIsWillArray){
                let arrayNetwork = this.network.split(',');
                let self = this;

                async.forEachOf(arrayNetwork, function (value, key, done) {
                    let [ valueNetwork, valueNetworkMask ] = value.split('/');
                    let ip4Address = new networkCalculator(valueNetwork, valueNetworkMask);

                    async.parallel([
                        function (callback) {
                            processed(ip4Address.netaddressInteger, self.taskIndex, function (err) {
                                if(err) callback(err);
                                else callback();
                            });
                        },
                        function (callback) {
                            processed(ip4Address.netbcastInteger, self.taskIndex, function (err) {
                                if(err) callback(err);
                                else callback();
                            });
                        }
                    ], function (err) {
                        if(err) done(err);
                        else done();
                    });
                }, function (err, result) {
                    if(err) feedback(err);
                    else feedback();
                });
            } else {
                if(!(~this.network.indexOf('/'))) return feedback();

                let [ valueNetwork, valueNetworkMask ] = this.network.split('/');
                let ip4Address = new networkCalculator(valueNetwork, valueNetworkMask);
                let self = this;

                async.parallel([
                    function (callback) {
                        processed(ip4Address.netaddressInteger, self.taskIndex, function (err) {
                            if(err) callback(err);
                            else callback();
                        });
                    },
                    function (callback) {
                        processed(ip4Address.netbcastInteger, self.taskIndex, function (err) {
                            if(err) callback(err);
                            else callback();
                        });
                    }
                ], function (err) {
                    if(err) feedback(err);
                    else feedback();
                });
            }

            function processed (indexHash, taskIndex, func) {
                redis.zrangebyscore('index_filter_settings_networks', [ indexHash, indexHash ], function (err, stringIndex) {
                    if(err) return func(err);

                    //проверяем вообще что то найдено
                    if(stringIndex.length === 0){
                        redis.zadd('index_filter_settings_networks', indexHash, indexHash + ':' + taskIndex, function (err) {
                            if(err) func(err);
                            else func(null, true);
                        });
                    } else {
                        if(~stringIndex[0].indexOf(' ')){
                            let arrayTaskIndex = stringIndex[0].split(' ');
                            let taskIndexIsExist = arrayTaskIndex.some((item) => item.split(':')[1] === taskIndex);
                            if(taskIndexIsExist) return func(null, true);
                        } else {
                            if(stringIndex[0].split(':')[1] === taskIndex) return func(null, true);
                        }

                        redis.zremrangebyscore('index_filter_settings_networks', [ indexHash, indexHash ], function (err) {
                            if(err) return func(err);

                            let newStringIndex = '';
                            if(~stringIndex[0].indexOf(' ')){
                                let arrayTaskIndex = stringIndex[0].split(' ');
                                arrayTaskIndex.push(indexHash + ':' + taskIndex);
                                newStringIndex = arrayTaskIndex.join(' ');
                            } else {
                                newStringIndex = stringIndex[0] + ' ' + indexHash + ':' + taskIndex;
                            }
                            redis.zadd('index_filter_settings_networks', indexHash, newStringIndex, function (err) {
                                if(err) func(err);
                                else func(null, true);
                            });
                        });
                    }
                });
            }
        };
        let tableIndexNetwork = new TableIndexNetwork(self.objFilterSettings.network, self.taskIndex);
        //если таблица index_filter_settings_networks не существует
        if(result === 0){
            tableIndexNetwork.createIndex(function (err) {
                if(err) func(err);
                else func();
            });
        } else {
            tableIndexNetwork.insertIndex(function (err) {
                if(err) func(err);
                else func();
            });
        }
    });
};