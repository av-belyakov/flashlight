/*
 * Вывод полной информации получаемой с выбранного источника
 *
 * Версия 0.11, дата релиза 22.05.2018
 * */

'use strict';

const async = require('async');

const globalObject = require('../../configure/globalObject');
const writeLogFile = require('../writeLogFile');

module.exports.getAllInformationSource = function(redis, sourceId, func) {
    async.waterfall([
        function(callback) {
            var pattern = new RegExp('^[0-9]+$');
            if (typeof sourceId === 'undefined' || !pattern.test(sourceId)) callback(new Error('Ошибка: некорректный идентификатор источника'));
            else callback(null, sourceId);
        },
        function(sourceId, callback) {
            redis.exists('remote_host:information:' + sourceId, function(err, isExists) {
                if (err) callback(err);
                else callback(null, sourceId, isExists);
            });
        },
        function(sourceId, isExists, callback) {
            redis.hmget('remote_host:settings:' + sourceId,
                'shortName',
                'detailedDescription',
                'ipaddress',
                'isAuthorization',
                function(err, array) {
                    if (err) callback(err);
                    else callback(null, sourceId, isExists, {
                        'shortName': array[0],
                        'detailedDescription': array[1],
                        'ipaddress': array[2],
                        'isAuthorization': array[3]
                    });
                });
        },
        function(sourceId, isExists, objSourceSettings, callback) {
            if (isExists === 1) {
                getInformation(objSourceSettings, function(err, obj) {
                    if (err) callback(err);
                    else callback(null, obj);
                });
            } else {
                callback(null, {
                    sourceId: sourceId,
                    name_source: objSourceSettings.shortName,
                    description: objSourceSettings.detailedDescription,
                    ipaddress: objSourceSettings.ipaddress,
                    isAuthorization: objSourceSettings.isAuthorization
                });
            }
        }
    ], function(err, result) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());

        result.connection = (globalObject.getData('sources', sourceId, 'connectionStatus') === 'connect');
        func(result);
    });

    //получить всю информацию полученную от выбранного узла
    function getInformation(objSourceSettings, func) {
        redis.hmget('remote_host:information:' + sourceId,
            'currentDateTime',
            'dateTimeReceived',
            'loadCPU',
            'randomAccessMemory',
            'loadNetwork',
            'diskSpace',
            'timeInterval',
            function(err, result) {
                if (err) return func(err);

                let isAuthorization = (objSourceSettings.isAuthorization === 'false') ? false : true;
                let objInformation = {
                    sourceId: sourceId,
                    name_source: objSourceSettings.shortName,
                    description: objSourceSettings.detailedDescription,
                    ipaddress: objSourceSettings.ipaddress,
                    isAuthorization: isAuthorization,
                    current_date_time: getDate(result[0]),
                    date_time_received: getDate(result[1]),
                    load_cpu: parseJSON(result[2]),
                    random_access_memory: parseJSON(result[3]),
                    load_network: getArrayLoadNetwork(parseJSON(result[4])), //load_network : parseJSON(result[4]),
                    disk_space: parseJSON(result[5]),
                    time_interval: parseJSON(result[6])
                };

                func(null, objInformation);
            });
    }

    //конвертирование даты и вермени из формата Unix в стандартный формат
    function getDate(dateUnix) {
        let x = (new Date()).getTimezoneOffset() * 60000;
        return (new Date((+dateUnix - x)).toISOString().slice(0, -1).replace(/T/, ' ').replace(/\..+/, ''));
    }

    //парсинг строки в формате JSON
    function parseJSON(stringJSON) {
        try {
            return JSON.parse(stringJSON);
        } catch (err) {
            writeLogFile.writeLog('\tError: ' + err.toString());
            return {};
        }
    }

    //информация по нагрузке на сетевые интерфейсы
    function getArrayLoadNetwork(loadNetwork) {
        try {
            let objResult = {};
            let arrayTmp = Object.keys(loadNetwork);

            arrayTmp.sort((a, b) => a.slice(-1) - b.slice(-1));

            arrayTmp.forEach(function(item) {
                objResult[item] = loadNetwork[item];
            });
            return objResult;
        } catch (err) {
            writeLogFile.writeLog('\tJSON parser error: ' + err.toString());
            return {};
        }
    }
};