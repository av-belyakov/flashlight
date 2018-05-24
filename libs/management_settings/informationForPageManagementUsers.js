/*
 * Подготовка информации для вывода на странице settings_users
 *
 * - getInformationForMainTable информация для вывода в основной таблице
 *
 * Версия 0.1, дата релиза 25.01.2016
 * */

'use strict';

const async = require('async');

const writeLogFile = require('../../libs/writeLogFile');

/* 
 * получить информацию по пользователям 
 * 
 * @param {*} redis - дискриптор соединения с БД
 * @param {*} req - запрос
 * @param {*} func - функция обратного вызова
 * */
exports.getInformationForMainTable = function(redis, req, func) {
    async.waterfall([
        function(callback) {
            redis.keys('user_authntication:*', (err, users) => {
                if (err) callback(err);
                else callback(null, users);
            });
        },
        function(arrayUsers, callback) {
            async.map(arrayUsers, (name, callbackMap) => {
                redis.hgetall(name, (err, obj) => {
                    if (err) callbackMap(err);
                    else callbackMap(null, obj);
                });
            }, function(err, arrayResult) {
                if (err) return callback(err);

                let objFinal = {};
                for (let i = 0; i < arrayResult.length; i++) {
                    objFinal[arrayResult[i].login] = Object.assign(arrayResult[i]);

                    delete objFinal[arrayResult[i].login].password;
                }

                callback(null, objFinal);
            });
        }
    ], function(err, result) {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());
        if (typeof result.administrator === 'undefined') writeLogFile.writeLog('\tError: administrator user not found (' + __dirname + ')');

        func(result);
    });
};

//получить список групп
exports.getItemGroups = function(redis, func) {
    redis.keys('user_group:*', (err, group) => {
        if (err) writeLogFile.writeLog('\tError: ' + err.toString());

        let arrayGroups = group.map((item) => item.split(':')[1]);
        func(arrayGroups);
    });
};