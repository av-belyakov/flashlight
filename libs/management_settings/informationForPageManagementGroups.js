/*
* Подготовка информации для вывода на странице settings_groups
*
* - getInformationForMainTable информация для вывода в основной таблице
*
* Версия 0.1, дата релиза 25.01.2016
* */

'use strict';

const async = require('async');

const writeLogFile = require('../../libs/writeLogFile');

exports.getInformationForMainTable = function (redis, req, func) {
    async.waterfall([
        function (callback) {
            redis.keys('user_group:*', function (err, groups) {
                if(err) callback(err);
                else callback(null, groups);
            });
        },
        function (arrayGroups, callback) {
            var resultObj = {};
            var arrayLength = arrayGroups.length;
            var i = 1;
            arrayGroups.forEach(function (name) {
                name = name.split(':')[1];
                redis.hgetall('user_group:' + name, function (err, obj) {
                    if(err) return callback(err);

                    resultObj[name] = obj;
                    if(i === arrayLength) callback(null, resultObj);
                    i++;
                });
            });
        }
    ], function (err, result) {
        if(err) writeLogFile.writeLog('\tError: ' + err.toString());
        if(result.administrator === undefined) writeLogFile.writeLog('\tError: the group administrator was not found');

        var finalResult = {};
        var arrayUserGroup = Object.keys(result);

        //выполняем сортировку настроек
        function sortSettings(obj) {
            let resultObj = {};
            let arraySettings = Object.keys(obj);
            arraySettings = arraySettings.sort();
            arraySettings.forEach(function (key) {
                resultObj[key] = obj[key];
            });
            return resultObj;
        }

        finalResult.administrator = sortSettings(result.administrator);

        //выполняем сортировку названий групп
        arrayUserGroup = arrayUserGroup.sort();
        for(let i = 0; i < arrayUserGroup.length; i++) {
            if(arrayUserGroup[i] === 'administrator') continue;
            finalResult[arrayUserGroup[i]] = sortSettings(result[arrayUserGroup[i]]);
        }
        func(finalResult);
    });
};
