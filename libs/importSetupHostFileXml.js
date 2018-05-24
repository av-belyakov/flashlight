/*
 * Импортирование и экспортирование данных об удаленных хостах (moth)
 *
 * при импортировании принимает на вход файл в формате xml
 *
 * Версия 0.1, дата релиза 20.02.2016
 * */

'use strict';

const fs = require('fs');
const async = require('async');
const xml2js = require('xml2js');

const controllers = require('../controllers');
const writeLogFile = require('./writeLogFile');
const globalObject = require('../configure/globalObject');

const redis = controllers.connectRedis();

//парсит и загружает в БД информацию по удаленным хостам
module.exports.importFileSetupHost = function(linkFile, func) {
    let directoryRoot = __dirname.substr(0, (__dirname.length - 5));

    async.waterfall([
        //читаем xml файл
        function(callback) {
            fs.readFile(directoryRoot + linkFile, 'utf8', function(err, file) {
                if (err) callback(err);
                else callback(null, file);
            });
        },
        //парсим xml файл с помощью xml2js
        function(file, callback) {
            let parser = new xml2js.Parser();
            parser.parseString(file, function(err, data) {
                if (err) callback(err);
                else callback(null, data);
            });
        },
        //серализуем в JSON строку в объект
        function(data, callback) {
            try {
                let string = JSON.stringify(data);
                callback(null, JSON.parse(string));
            } catch (err) {
                callback(err);
            }
        },
        //проверяем информацию перед ее загрузкой в БД
        function(obj, callback) {
            if ((!obj.hasOwnProperty('setup_hosts')) || (!obj.setup_hosts.hasOwnProperty('host'))) {
                return callback(new Error('Error: not valid xml file'));
            }

            let remoteHosts = obj.setup_hosts.host;
            let objSettingName = {
                id: 'int',
                short_name: 'stringEnInt',
                detailed_description: 'stringRuEnInt',
                ip_address: 'ipaddressString',
                port: 'int',
                date_create: 'int',
                date_changes: 'int',
                date_last_connected: 'int',
                number_connection_attempts: 'int',
                token: 'token',
                max_count_process_filtering: 'int'
            };
            let objRegexpPattern = {
                int: new RegExp('^[0-9]+$'),
                stringEnInt: new RegExp('^[a-zA-Z0-9_\\-\\s]{3,15}$'),
                stringRuEnInt: new RegExp('^[a-zA-Zа-яА-Яё0-9_\\-\\s\\.,]+$'),
                ipaddressString: new RegExp('^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$'),
                token: new RegExp('^[a-zA-Z0-9\\s]+$')
            };

            let num = 0;
            remoteHosts.forEach(function(item) {
                for (let name in objSettingName) {
                    if (typeof item[name] === 'undefined') {
                        return callback(new Error('Error: not valid xml file'));
                    }
                    let pattern = objRegexpPattern[objSettingName[name]];

                    if (!pattern.test(item[name])) {
                        return callback(new Error('Error: not valid xml file'));
                    }
                }
                if (num === (obj.setup_hosts.host.length - 1)) callback(null, obj.setup_hosts.host);
                num++;
            });
        },
        //получаем массив со списком хостов
        function(arrayHosts, callback) {
            redis.lrange('remote_hosts_exist:id', [0, -1], function(err, arrayHostsExist) {
                if (err) return callback(err);

                let objHostsExist = {};
                for (let num = 0; num < arrayHostsExist.length; num++) {
                    objHostsExist[arrayHostsExist[num]] = true;
                }

                callback(null, arrayHosts, objHostsExist);
            });
        },
        //загружаем всю основную информацию в БД (remote_host:setting:*) и в объект globalObject.source
        function(arrayHosts, objHostsExist, callback) {
            let num = 0;
            let arrayStringId = [];

            arrayHosts.forEach(function(item) {
                if (typeof objHostsExist[item.id] === 'undefined') {
                    globalObject.setData('sources', item.id[0], {
                        'connectionStatus': 'disconnect',
                        'shortName': item.short_name[0],
                        'detailedDescription': item.detailed_description[0],
                        'ipaddress': item.ip_address[0],
                        'port': item.port[0],
                        'dateLastConnected': item.date_last_connected[0],
                        'numberConnectionAttempts': 0,
                        'token': item.token[0],
                        'maxCountProcessFiltering': item.max_count_process_filtering[0]
                    });

                    redis.hmset('remote_host:settings:' + item.id[0], {
                        'shortName': item.short_name[0],
                        'detailedDescription': item.detailed_description[0],
                        'ipaddress': item.ip_address[0],
                        'port': item.port[0],
                        'dateCreate': item.date_create[0],
                        'dateChanges': item.date_changes[0],
                        'dateLastConnected': item.date_last_connected[0],
                        'numberConnectionAttempts': item.number_connection_attempts[0],
                        'token': item.token[0],
                        'maxCountProcessFiltering': item.max_count_process_filtering[0],
                        'isAuthorization': true
                    }, function(err) {
                        if (err) return callback(err);
                    });
                    arrayStringId.push(item.id);
                }

                if (num === (arrayHosts.length - 1)) callback(null, arrayStringId, arrayHosts.length);
                num++;
            });
        },
        //добавляем список id хостов в remote_hosts_exist:id и в remote_host_connect:disconnect
        function(arrayStringId, remoteHostsLength, callback) {
            let num = 0;
            let objResult = { allHosts: remoteHostsLength, loadHosts: arrayStringId.length };

            if (arrayStringId.length === 0) return callback(null, objResult);

            arrayStringId.forEach(function(item) {
                redis.rpush('remote_hosts_exist:id', item);

                if (num === (arrayStringId.length - 1)) callback(null, objResult);
                num++;
            });
        }
    ], function(err, result) {
        if (err) return func(err);

        //удаляем загруженный файл
        fs.unlink(directoryRoot + linkFile, function(err) {
            if (err) writeLogFile.writeLog('\tError: ' + err.toString());
        });

        func(null, result);
    });
};