/*
 * Формирование информации для центральной панели основного контента
 *
 * Версия 0.11, дата релиза 22.05.2018
 * */

'use strict';

const async = require('async');

const controllers = require('../controllers');
const writeLogFile = require('./writeLogFile');
const globalObject = require('../configure/globalObject');

const redis = controllers.connectRedis();

exports.getInformationForWidgets = function(userId, func) {
    async.waterfall([
        //получение списка источников для выбранного пользователя
        function(callback) {
            redis.hget('user_authntication:' + userId, 'settings', function(err, listSettings) {
                if (err) return callback(err);

                let obj = JSON.parse(listSettings);
                callback(null, obj.remoteHosts);
            });
        },
        //формирование массива состоящего из идентификаторов источников и их кратких имен
        function(arraySources, callback) {
            getNameSources(arraySources, callback);
        },
        //получение списка подключенных источников
        function(arraySources, objSourcesName, callback) {
            getListConnectionSources(arraySources, objSourcesName, callback);
        },
        //получение всей информации приходящей с источников
        function(arraySources, objSourcesName, callback) {
            getInformationForSources(arraySources, objSourcesName, callback);
        },
        //формирование объекта с краткой информацией по выбранным источникам
        function(objSourcesName, objSources, callback) {
            getShortInformationForSources(objSourcesName, objSources, callback);
        }
    ], function(err, result) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());
        func(result);
    });
};

//получение списка подключенных источников
function getListConnectionSources(arraySources, objSourcesName, callback) {
    let arrayResult = [];
    let sources = globalObject.getData('sources');

    for (let hostId in sources) {
        if (sources[hostId].connectionStatus === 'connect') {
            arrayResult.push(hostId);
        }
    }

    callback(null, arrayResult, objSourcesName);
}

//получение всей информации приходящей с источников
function getInformationForSources(arraySources, objSourcesName, callback) {
    if (arraySources.length === 0) return callback(null, objSourcesName, {});

    let newObj = {};
    let num = 0;
    arraySources.forEach(function(source) {
        redis.hmget('remote_host:information:' + source,
            'currentDateTime',
            'dateTimeReceived',
            'diskSpace',
            'timeInterval',
            'loadCPU',
            'randomAccessMemory',
            'loadNetwork',
            function(err, obj) {
                if (err) return callback(err);

                newObj[source] = {
                    currentDateTime: obj[0],
                    dateTimeReceived: obj[1],
                    diskSpace: obj[2],
                    timeInterval: obj[3],
                    loadCPU: obj[4],
                    randomAccessMemory: obj[5],
                    loadNetwork: obj[6]
                };
                if ((arraySources.length - 1) === num) {
                    callback(null, objSourcesName, newObj);
                }
                num++;
            });
    });
}

//формирование массива состоящего из идентификаторов источников и их кратких имен
function getNameSources(arraySources, callback) {
    if (arraySources.length === 0) return callback(null, arraySources, {});

    let newObj = {};
    async.map(arraySources, function(source, callbackMap) {
        redis.hmget('remote_host:settings:' + source,
            'shortName',
            'detailedDescription',
            'ipaddress', (err, arrayResult) => {
                if (err) return callbackMap(err);

                newObj[source] = {
                    'shortName': arrayResult[0],
                    'detailedDescription': arrayResult[1],
                    'ipaddress': arrayResult[2]
                };

                callbackMap(null, newObj);
            });
    }, function(err, arrayResult) {
        if (err) callback(err);
        else callback(null, arraySources, arrayResult[0]);
    });
}

//формирование объекта с краткой информацией по выбранным источникам
function getShortInformationForSources(objSourcesName, objSources, callback) {
    var newObjSources = {};
    for (let source in objSourcesName) {
        newObjSources[source] = {};
        newObjSources[source].name = objSourcesName[source];
        newObjSources[source].diskSpace = [];

        if ((typeof objSources[source] === 'undefined') || (typeof objSources[source].currentDateTime === 'undefined')) {
            newObjSources[source].currentDateTime = null;
            continue;
        }

        newObjSources[source].currentDateTime = objSources[source].currentDateTime;
        newObjSources[source].dateTimeReceived = objSources[source].dateTimeReceived;
        newObjSources[source].timeInterval = objSources[source].timeInterval;
        newObjSources[source].loadCPU = objSources[source].loadCPU;
        newObjSources[source].randomAccessMemory = objSources[source].randomAccessMemory;
        newObjSources[source].diskSpace = getObjectDiskSpace(objSources[source].diskSpace);
        newObjSources[source].loadNetwork = getArrayLoadNetwork(objSources[source].loadNetwork);
    }
    callback(null, newObjSources);
}

//информация по занятому дисковому пространству
function getObjectDiskSpace(diskSpaceString) {
    let arrayResult = [];
    try {
        let diskSpace = JSON.parse(diskSpaceString);
        for (let disk in diskSpace) {
            if ((typeof diskSpace[disk].mounted === 'undefined') || (typeof diskSpace[disk].used === 'undefined')) continue;
            arrayResult.push({
                mounted: diskSpace[disk].mounted,
                used: diskSpace[disk].used.slice(0, -1)
            });
        }
        return arrayResult;
    } catch (err) {
        writeLogFile.writeLog('\tJSON parser error: ' + err.toString());
        return arrayResult;
    }
}

//информация по нагрузке на сетевые интерфейсы
function getArrayLoadNetwork(network) {
    try {
        var objResult = {};
        let loadNetwork = JSON.parse(network);
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